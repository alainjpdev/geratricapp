import React, { useState } from 'react';
import { X, Calendar, Download, Printer, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { medicalService } from '../../services/medicalService';
import { residentService } from '../../services/residentService';

interface LogbookPrintModalProps {
    isOpen: boolean;
    onClose: () => void;
    residentId: string;
    initialDate?: string;
}

export const LogbookPrintModal: React.FC<LogbookPrintModalProps> = ({
    isOpen,
    onClose,
    residentId,
    initialDate
}) => {
    const [mode, setMode] = useState<'single' | 'range'>('single');
    const [startDate, setStartDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState('');

    const generatePDF = async () => {
        setLoading(true);
        setProgress('Obteniendo datos...');
        try {
            // 1. Fetch Data
            const start = mode === 'single' ? startDate : startDate;
            const end = mode === 'single' ? startDate : endDate;

            const [
                resident,
                staffing,
                vitals,
                meds,
                care,
                nutrition,
                elimination
            ] = await Promise.all([
                residentService.getResidentById(residentId),
                medicalService.getDailyStaffingRange(residentId, start, end),
                medicalService.getVitalsRange(residentId, start, end),
                medicalService.getMedicationsRange(residentId, start, end),
                medicalService.getCareLogsRange(residentId, start, end),
                medicalService.getNutritionLogsRange(residentId, start, end),
                medicalService.getEliminationLogsRange(residentId, start, end)
            ]);

            setProgress('Generando reporte...');

            // 2. Render HTML for PDF
            // We create a temporary container off-screen
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.top = '0';
            container.style.width = '800px'; // A4 width approx at 96dpi
            container.style.backgroundColor = 'white';
            container.style.color = 'black';
            container.style.padding = '40px';
            container.className = 'print-container';

            // Generate Content HTML
            let htmlContent = `
                <div style="font-family: sans-serif; color: #333;">
                    <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #ccc; padding-bottom: 10px;">
                        <h1 style="margin: 0; color: #1e40af;">Bitácora de Enfermería</h1>
                        <p style="margin: 5px 0 0;">${resident.firstName} ${resident.lastName} - Habitación ${resident.roomNumber || 'N/A'}</p>
                        <p style="font-size: 12px; color: #666;">Reporte del: ${start} al ${end}</p>
                    </div>
            `;

            // Helper to group by date
            const days = getDaysArray(new Date(start), new Date(end));

            days.forEach(d => {
                const dayStr = d.toISOString().split('T')[0];
                const dayStaff = staffing.find((s: any) => s.date === dayStr);
                const dayVitals = vitals.filter((v: any) => v.date === dayStr);
                const dayMeds = meds.filter((m: any) => m.date === dayStr);
                const dayCare = care.filter((c: any) => c.date === dayStr);
                const dayNut = nutrition.filter((n: any) => n.date === dayStr);
                const dayElim = elimination.filter((e: any) => e.date === dayStr);

                htmlContent += `
                    <div style="margin-bottom: 30px; page-break-inside: avoid; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                        <div style="background-color: #f3f4f6; padding: 10px 15px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                            <h3 style="margin: 0; font-size: 16px;">${dayStr}</h3>
                            <div style="font-size: 10px;">
                                ${dayStaff ? `
                                    <span style="margin-left: 10px;"><b>Mañana:</b> ${dayStaff.tmNurse || '-'}</span>
                                    <span style="margin-left: 10px;"><b>Tarde:</b> ${dayStaff.tvNurse || '-'}</span>
                                    <span style="margin-left: 10px;"><b>Noche:</b> ${dayStaff.tnNurse || '-'}</span>
                                ` : '<span style="color: #999;">Sin personal asignado</span>'}
                            </div>
                        </div>
                        
                        <div style="padding: 15px;">
                            ${dayStaff?.relevantNotes ? `
                                <div style="margin-bottom: 10px; padding: 8px; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 4px; font-size: 12px;">
                                    <strong>Notas Relevantes:</strong> ${dayStaff.relevantNotes}
                                </div>
                            ` : ''}

                            ${dayVitals.length > 0 ? `
                                <h4 style="margin: 10px 0 5px; font-size: 14px; border-bottom: 1px solid #eee;">Signos Vitales</h4>
                                <table style="width: 100%; font-size: 11px; border-collapse: collapse; margin-bottom: 10px;">
                                    <tr style="background-color: #f9fafb; text-align: left;">
                                        <th style="padding: 4px;">Hora</th>
                                        <th style="padding: 4px;">P/A</th>
                                        <th style="padding: 4px;">F.C.</th>
                                        <th style="padding: 4px;">F.R.</th>
                                        <th style="padding: 4px;">Temp</th>
                                        <th style="padding: 4px;">SatO2</th>
                                        <th style="padding: 4px;">Glicemia</th>
                                    </tr>
                                    ${dayVitals.map((v: any) => `
                                        <tr style="border-bottom: 1px solid #f3f4f6;">
                                            <td style="padding: 4px;">${v.time?.slice(0, 5)}</td>
                                            <td style="padding: 4px;">${v.ta || '-'}</td>
                                            <td style="padding: 4px;">${v.fc || '-'}</td>
                                            <td style="padding: 4px;">${v.fr || '-'}</td>
                                            <td style="padding: 4px;">${v.temp || '-'}</td>
                                            <td style="padding: 4px;">${v.sato2 || '-'}</td>
                                            <td style="padding: 4px;">${v.dxtx || '-'}</td>
                                        </tr>
                                    `).join('')}
                                </table>
                            ` : ''}

                             ${dayMeds.length > 0 ? `
                                <h4 style="margin: 10px 0 5px; font-size: 14px; border-bottom: 1px solid #eee;">Medicamentos</h4>
                                <ul style="font-size: 11px; margin: 0; padding-left: 20px;">
                                    ${dayMeds.map((m: any) => `
                                        <li><b>${m.hora?.slice(0, 5)}</b> - ${m.medicamento} (${m.dosis}) ${m.observacion ? `- ${m.observacion}` : ''}</li>
                                    `).join('')}
                                </ul>
                            ` : ''}

                            ${(dayCare.length + dayNut.length + dayElim.length) > 0 ? `
                                <h4 style="margin: 10px 0 5px; font-size: 14px; border-bottom: 1px solid #eee;">Cuidados y Hoja Clínica</h4>
                                <div style="font-size: 11px;">
                                    ${dayNut.length > 0 ? `<p style="margin: 2px 0;"><b>Alimentación:</b> ${dayNut.map((n: any) => `${n.time?.slice(0, 5)} (${n.description})`).join(', ')}</p>` : ''}
                                    ${dayElim.length > 0 ? `<p style="margin: 2px 0;"><b>Eliminación:</b> ${dayElim.map((e: any) => `${e.time?.slice(0, 5)} (${e.type})`).join(', ')}</p>` : ''}
                                    ${dayCare.length > 0 ? `<p style="margin: 2px 0;"><b>Higiene/Cuidados:</b> ${dayCare.map((c: any) => `${c.time?.slice(0, 5)} (${c.care_type})`).join(', ')}</p>` : ''}
                                </div>
                            `: ''}

                            ${dayStaff?.condition ? `
                                <div style="margin-top: 10px; padding: 8px; background-color: #eff6ff; border: 1px solid #dbeafe; border-radius: 4px; font-size: 12px;">
                                    <strong>Condición General:</strong> ${dayStaff.condition}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            });

            htmlContent += `</div>`;
            container.innerHTML = htmlContent;
            document.body.appendChild(container);

            // 3. Convert to PDF using html2canvas + jsPDF
            const canvas = await html2canvas(container, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pdfWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight;
            }

            pdf.save(`Bitacora_${resident.firstName}_${start}_${end}.pdf`);

            // Cleanup
            document.body.removeChild(container);
            onClose();

        } catch (error) {
            console.error("Error creating PDF:", error);
            alert("Error al generar el PDF. Revise la consola.");
        } finally {
            setLoading(false);
            setProgress('');
        }
    };

    const getDaysArray = (start: Date, end: Date) => {
        for (var arr = [], dt = new Date(start); dt <= new Date(end); dt.setDate(dt.getDate() + 1)) {
            arr.push(new Date(dt));
        }
        return arr;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Printer className="w-5 h-5 text-sky-600" />
                        Imprimir Bitácora
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Mode Selection */}
                    <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                        <button
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === 'single' ? 'bg-white dark:bg-gray-600 text-sky-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                            onClick={() => setMode('single')}
                        >
                            Un Solo Día
                        </button>
                        <button
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === 'range' ? 'bg-white dark:bg-gray-600 text-sky-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                            onClick={() => setMode('range')}
                        >
                            Rango de Fechas
                        </button>
                    </div>

                    {/* Date Inputs */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                {mode === 'single' ? 'Fecha' : 'Fecha Inicio'}
                            </label>
                            <input
                                type="date"
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2.5 bg-transparent text-sm focus:ring-2 focus:ring-sky-500 dark:text-white"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        {mode === 'range' && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                    Fecha Fin
                                </label>
                                <input
                                    type="date"
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2.5 bg-transparent text-sm focus:ring-2 focus:ring-sky-500 dark:text-white"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    min={startDate}
                                />
                            </div>
                        )}
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={generatePDF}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium shadow-sm flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {progress || 'Procesando...'}
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    Descargar PDF
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
