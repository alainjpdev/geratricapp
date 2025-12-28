import React, { useState, useEffect } from 'react';
import { UserPlus, ChevronDown } from 'lucide-react';

interface GradesProps {
  classId: string;
  isTeacher?: boolean;
}

interface Assignment {
  id: string;
  title: string;
  points: number;
  maxPoints: number;
}

interface StudentGrade {
  studentId: string;
  studentName: string;
  grades: { [assignmentId: string]: number | null };
  average?: number;
}

export const Grades: React.FC<GradesProps> = ({ classId, isTeacher = true }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'lastName' | 'firstName'>('lastName');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  useEffect(() => {
    loadGrades();
  }, [classId]);

  const loadGrades = async () => {
    setLoading(true);
    try {
      // TODO: Load from API
      // const res = await apiClient.get(`/api/classes/${classId}/grades`);
      // setAssignments(res.data.assignments || []);
      // setStudentGrades(res.data.studentGrades || []);
      
      // Mock data for now
      setAssignments([]);
      setStudentGrades([]);
    } catch (err) {
      console.error('Error loading grades:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteStudents = () => {
    // TODO: Open invite students modal
    console.log('Invite students');
  };

  const calculateClassAverage = (assignmentId: string): number | null => {
    if (studentGrades.length === 0) return null;
    const grades = studentGrades
      .map(sg => sg.grades[assignmentId])
      .filter(g => g !== null && g !== undefined) as number[];
    if (grades.length === 0) return null;
    const sum = grades.reduce((acc, g) => acc + g, 0);
    return Math.round((sum / grades.length) * 100) / 100;
  };

  const calculateStudentAverage = (studentGrade: StudentGrade): number | null => {
    if (assignments.length === 0) return null;
    const grades = assignments
      .map(a => studentGrade.grades[a.id])
      .filter(g => g !== null && g !== undefined) as number[];
    if (grades.length === 0) return null;
    const sum = grades.reduce((acc, g) => acc + g, 0);
    return Math.round((sum / grades.length) * 100) / 100;
  };

  const sortedStudentGrades = [...studentGrades].sort((a, b) => {
    const aName = sortBy === 'lastName' 
      ? a.studentName.split(' ').pop() || ''
      : a.studentName.split(' ')[0] || '';
    const bName = sortBy === 'lastName'
      ? b.studentName.split(' ').pop() || ''
      : b.studentName.split(' ')[0] || '';
    return aName.localeCompare(bName);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green-medium"></div>
      </div>
    );
  }

  if (assignments.length === 0 || studentGrades.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          viewBox="0 0 181 143"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-48 h-auto mx-auto mb-4 text-gray-400"
          aria-hidden="true"
        >
          <path
            d="M160.156 107.599C161.764 100.018 166.818 93.3552 172.944 90.7515C173.94 90.3686 175.165 90.1388 175.701 91.0578C176.084 91.747 175.931 92.7426 175.625 93.6615C173.251 101.549 166.282 107.369 159.543 107.063"
            fill="#CEEAD6"
          />
          <path
            d="M160.615 108.441C160.768 100.707 157.322 92.9724 151.884 88.9902C151.042 88.3776 149.893 87.8415 149.128 88.6839C148.592 89.2965 148.515 90.2921 148.592 91.211C149.128 99.4051 154.641 106.757 161.227 108.059"
            fill="#CEEAD6"
          />
          <path
            d="M160.156 123.298C161.764 115.717 166.818 109.054 172.944 106.451C173.94 106.068 175.165 105.838 175.701 106.757C176.084 107.446 175.931 108.442 175.625 109.361C173.251 117.248 166.282 123.069 159.543 122.762"
            fill="#CEEAD6"
          />
          <path
            d="M159.083 124.906C159.236 117.172 155.79 109.437 150.353 105.455C149.511 104.842 148.362 104.306 147.596 105.149C147.06 105.761 146.984 106.757 147.06 107.676C147.596 115.87 153.11 123.222 159.696 124.523"
            fill="#CEEAD6"
          />
          <path
            d="M73.3906 120.848H99.4278"
            stroke="#5F6368"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M164.521 82.5576C163.244 87.4077 161.034 98.8999 160.309 105.914C159.16 117.019 159.415 124.166 159.16 128.888"
            stroke="#5F6368"
            strokeWidth="2"
          />
          <path
            d="M164.291 89.1436C168.52 89.1436 171.949 85.6122 171.949 81.2559C171.949 76.8996 168.52 73.3682 164.291 73.3682C160.061 73.3682 156.633 76.8996 156.633 81.2559C156.633 85.6122 160.061 89.1436 164.291 89.1436Z"
            fill="#DADCE0"
          />
          <path
            d="M84.1885 139.227C112.829 139.074 168.12 137.159 171.872 136.93C177.846 136.623 182.67 133.254 180.449 129.808C178.228 126.362 132.281 127.357 117.041 128.889C118.573 129.425 84.1885 139.227 84.1885 139.227Z"
            fill="#DADCE0"
          />
          <path
            d="M6.07715 109.207C9.6764 117.171 15.1136 124.217 22.1589 129.73C25.5284 132.411 31.5782 134.632 38.3172 136.546C60.4488 142.749 83.8056 142.749 105.937 136.469C112.6 134.632 118.496 132.334 121.866 129.73C128.911 124.217 134.348 117.095 137.948 109.207H79.5172L78.0622 121H30.5827L30.3529 109.207H6.07715Z"
            fill="#DADCE0"
          />
          <path
            d="M71.6296 30.8661C102.081 30.8661 126.767 24.1804 126.767 15.9331C126.767 7.68576 102.081 1 71.6296 1C41.1781 1 16.4922 7.68576 16.4922 15.9331C16.4922 24.1804 41.1781 30.8661 71.6296 30.8661Z"
            stroke="#5F6368"
            strokeWidth="2"
            strokeMiterlimit="10"
          />
          <path
            d="M126.767 15.9326L140.934 72.6782C146.295 94.1206 138.637 116.712 121.483 130.19C118.113 132.793 112.14 135.091 105.554 136.929C83.4226 143.132 60.3721 141.83 37.9342 137.005C7.68519 130.496 -3.03598 94.1206 2.32461 72.6782L16.4919 15.9326"
            stroke="#5F6368"
            strokeWidth="2"
            strokeMiterlimit="10"
          />
          <path
            d="M74.5393 120.924H30.1996L27.213 49.5515C27.1364 46.8712 29.2041 44.6504 31.8078 44.6504H71.7824C74.233 44.6504 76.3007 46.6415 76.3772 49.1686L79.2107 116.023C79.2873 118.703 77.143 120.924 74.5393 120.924Z"
            stroke="#5F6368"
            strokeWidth="2"
            strokeMiterlimit="10"
          />
          <path
            d="M26.8303 46.6416L21.4697 121.843H29.5106L26.8303 46.6416Z"
            fill="#5F6368"
          />
          <path
            d="M45.2094 91.8999C48.5929 91.8999 51.3358 89.0885 51.3358 85.6204C51.3358 82.1523 48.5929 79.3408 45.2094 79.3408C41.8259 79.3408 39.083 82.1523 39.083 85.6204C39.083 89.0885 41.8259 91.8999 45.2094 91.8999Z"
            fill="#5F6368"
          />
          <path
            d="M45.2094 112.347C48.5929 112.347 51.3358 109.536 51.3358 106.068C51.3358 102.6 48.5929 99.7881 45.2094 99.7881C41.8259 99.7881 39.083 102.6 39.083 106.068C39.083 109.536 41.8259 112.347 45.2094 112.347Z"
            fill="#5F6368"
          />
          <path
            d="M64.3539 91.8999C67.7374 91.8999 70.4803 89.0885 70.4803 85.6204C70.4803 82.1523 67.7374 79.3408 64.3539 79.3408C60.9704 79.3408 58.2275 82.1523 58.2275 85.6204C58.2275 89.0885 60.9704 91.8999 64.3539 91.8999Z"
            fill="#5F6368"
          />
          <path
            d="M64.3539 112.347C67.7374 112.347 70.4803 109.536 70.4803 106.068C70.4803 102.6 67.7374 99.7881 64.3539 99.7881C60.9704 99.7881 58.2275 102.6 58.2275 106.068C58.2275 109.536 60.9704 112.347 64.3539 112.347Z"
            fill="#5F6368"
          />
          <path
            d="M67.7241 72.2193H38.6237C36.939 72.2193 35.5605 70.8408 35.5605 69.1561V54.8357C35.5605 53.1509 36.939 51.7725 38.6237 51.7725H67.7241C69.4088 51.7725 70.7873 53.1509 70.7873 54.8357V69.1561C70.7873 70.8408 69.4088 72.2193 67.7241 72.2193Z"
            fill="#5F6368"
          />
          <path
            d="M92.6885 52.4619C95.2262 52.4619 97.2833 50.3704 97.2833 47.7905C97.2833 45.2106 95.2262 43.1191 92.6885 43.1191C90.1509 43.1191 88.0938 45.2106 88.0938 47.7905C88.0938 50.3704 90.1509 52.4619 92.6885 52.4619Z"
            fill="#DADCE0"
          />
          <path
            d="M122.555 57.2099C125.092 57.2099 127.15 55.1185 127.15 52.5386C127.15 49.9586 125.092 47.8672 122.555 47.8672C120.017 47.8672 117.96 49.9586 117.96 52.5386C117.96 55.1185 120.017 57.2099 122.555 57.2099Z"
            fill="#DADCE0"
          />
          <path
            d="M114.131 43.042C116.669 43.042 118.726 40.9505 118.726 38.3706C118.726 35.7907 116.669 33.6992 114.131 33.6992C111.593 33.6992 109.536 35.7907 109.536 38.3706C109.536 40.9505 111.593 43.042 114.131 43.042Z"
            fill="#DADCE0"
          />
          <path
            d="M124.24 76.5078C124.24 90.9814 112.447 102.775 97.9733 102.775C85.1079 102.775 74.3867 93.5085 72.1659 81.3323C71.7064 78.8052 73.6975 76.5078 76.2246 76.5078H124.24Z"
            fill="#1E8E3E"
          />
          <path
            d="M135.574 79.3413C135.574 80.8729 132.434 82.1747 129.907 82.1747C127.38 82.1747 121.177 80.8729 121.177 79.3413C121.177 77.8097 127.38 76.5078 129.907 76.5078C132.511 76.5078 135.574 77.8097 135.574 79.3413Z"
            fill="#1E8E3E"
          />
          <path
            d="M131.438 69.0793C132.511 70.1514 131.209 73.2912 129.447 75.0525C127.609 76.8905 122.325 80.3365 121.253 79.2644C120.181 78.1923 123.627 72.9083 125.465 71.0704C127.227 69.3091 130.29 68.0072 131.438 69.0793Z"
            fill="#1E8E3E"
          />
          <path
            d="M84.0353 88.2249C86.2769 88.2249 88.094 86.4077 88.094 84.1661C88.094 81.9246 86.2769 80.1074 84.0353 80.1074C81.7937 80.1074 79.9766 81.9246 79.9766 84.1661C79.9766 86.4077 81.7937 88.2249 84.0353 88.2249Z"
            fill="white"
          />
          <path
            d="M92.076 79.265C94.2202 85.6977 93.8373 92.6665 90.7741 98.7163C90.3147 99.7118 91.7697 100.554 92.2291 99.5586C95.4455 93.1259 95.9816 85.6211 93.6842 78.8055C93.3778 77.7334 91.6931 78.1929 92.076 79.265Z"
            fill="white"
          />
          <path
            d="M94.9863 85.2374C95.0629 85.1608 95.216 85.1608 95.2926 85.0842C95.4458 85.0076 95.1394 85.1608 95.2926 85.0842C95.3692 85.0842 95.4458 85.0076 95.5223 85.0076C95.8287 84.931 96.135 84.7779 96.4413 84.7013C97.2837 84.4716 97.6666 84.4716 98.509 84.395C98.8919 84.395 99.2748 84.395 99.6577 84.4716C99.8108 84.4716 99.5811 84.4716 99.8108 84.4716C99.8874 84.4716 99.964 84.4716 100.117 84.5481C100.27 84.6247 100.5 84.6247 100.653 84.7013C101.266 84.8545 101.802 85.2374 102.185 85.6968C102.338 85.9266 102.568 86.3095 102.644 86.5392C102.797 86.9987 102.797 87.305 102.797 87.7645C102.797 88.6069 102.644 89.2961 102.185 89.9853C102.108 90.1385 102.185 89.9853 102.108 90.1385C102.032 90.215 102.032 90.2916 101.955 90.2916C101.878 90.3682 101.572 90.5979 101.572 90.6745C101.419 90.8277 100.96 91.0574 100.653 91.2106C100.577 91.2872 100.653 91.2106 100.653 91.2106C100.577 91.2106 100.577 91.2872 100.5 91.2872C100.423 91.2872 100.347 91.3637 100.194 91.3637C100.041 91.4403 99.8108 91.4403 99.6577 91.5169C99.5045 91.5935 99.2748 91.5935 99.1216 91.5935C99.045 91.5935 99.1216 91.5935 99.1216 91.5935C99.045 91.5935 99.045 91.5935 98.9684 91.5935C98.8919 91.5935 98.7387 91.5935 98.6621 91.5935C98.2026 91.5935 97.8197 91.5935 97.3603 91.5935C97.2837 91.5935 97.2071 91.5935 97.0539 91.5935C96.9008 91.5935 97.0539 91.5935 97.0539 91.5935C96.9774 91.5935 96.9774 91.5935 96.9008 91.5935C96.7476 91.5935 96.5179 91.5169 96.3647 91.4403C96.2116 91.3637 95.9818 91.3637 95.8287 91.2872C95.7521 91.2872 95.6755 91.2106 95.5989 91.2106C95.7521 91.2872 95.5989 91.2106 95.5223 91.2106C95.3692 91.134 95.2926 91.0574 95.1394 90.9808C94.9863 90.9043 95.216 91.0574 95.1394 90.9808C95.0629 90.9043 95.0629 90.9043 94.9863 90.8277C94.2205 89.9853 92.9952 91.2106 93.761 92.053C94.7565 93.1251 96.671 93.4314 98.0495 93.3548C99.8874 93.3548 101.802 92.8188 103.104 91.4403C104.559 89.8321 104.865 87.305 103.946 85.3139C103.104 83.5526 101.189 82.7868 99.3513 82.6336C97.59 82.4805 95.5989 82.7868 94.0673 83.6292C93.1484 84.2418 94.0673 85.7734 94.9863 85.2374Z"
            fill="white"
          />
          <path
            d="M84.0356 86.08C85.0929 86.08 85.9501 85.2228 85.9501 84.1655C85.9501 83.1081 85.0929 82.251 84.0356 82.251C82.9782 82.251 82.1211 83.1081 82.1211 84.1655C82.1211 85.2228 82.9782 86.08 84.0356 86.08Z"
            fill="#5F6368"
          />
        </svg>
        <p className="text-lg font-medium text-gray-900 mb-2">
          This is where you'll view and manage grades
        </p>
        {isTeacher && (
          <button
            onClick={handleInviteStudents}
            className="px-4 py-2 bg-brand-green-light text-white rounded-lg hover:bg-brand-green-medium transition-colors flex items-center gap-2 mx-auto"
          >
            <UserPlus className="w-5 h-5" />
            <span>Invite students</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left p-4 sticky left-0 bg-gray-50 z-10 min-w-[200px]">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      onClick={() => setSortMenuOpen(!sortMenuOpen)}
                      className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                    >
                      <span>
                        {sortBy === 'lastName' ? 'Sort by last name' : 'Sort by first name'}
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {sortMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setSortMenuOpen(false)}
                        ></div>
                        <div className="absolute left-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[180px]">
                          <button
                            onClick={() => {
                              setSortBy('lastName');
                              setSortMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                              sortBy === 'lastName' ? 'text-brand-green-medium font-medium' : 'text-gray-800'
                            }`}
                          >
                            Sort by last name
                          </button>
                          <button
                            onClick={() => {
                              setSortBy('firstName');
                              setSortMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                              sortBy === 'firstName' ? 'text-brand-green-medium font-medium' : 'text-gray-800'
                            }`}
                          >
                            Sort by first name
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </th>
              {assignments.map((assignment) => (
                <th key={assignment.id} className="text-center p-4 min-w-[120px]">
                  <div className="flex flex-col items-center">
                    <div className="text-sm font-medium text-gray-900">{assignment.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      out of {assignment.maxPoints}
                    </div>
                  </div>
                </th>
              ))}
              <th className="w-4 p-4" aria-hidden="true"></th>
            </tr>
          </thead>
          <tbody>
            {/* Class Average Row */}
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left p-4 sticky left-0 bg-gray-50 z-10">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">Class average</span>
                </div>
              </th>
              {assignments.map((assignment) => {
                const avg = calculateClassAverage(assignment.id);
                return (
                  <td key={assignment.id} className="text-center p-4">
                    <div className="text-sm text-gray-700">
                      {avg !== null ? avg.toFixed(2) : '—'}
                    </div>
                  </td>
                );
              })}
              <td className="w-4" aria-hidden="true"></td>
            </tr>

            {/* Student Rows */}
            {sortedStudentGrades.map((studentGrade) => {
              const studentAvg = calculateStudentAverage(studentGrade);
              return (
                <tr key={studentGrade.studentId} className="border-b border-gray-200 hover:bg-gray-50">
                  <th className="text-left p-4 sticky left-0 bg-white z-10">
                    <div className="text-sm font-medium text-gray-900">
                      {studentGrade.studentName}
                    </div>
                  </th>
                  {assignments.map((assignment) => {
                    const grade = studentGrade.grades[assignment.id];
                    return (
                      <td key={assignment.id} className="text-center p-4">
                        <div className="text-sm text-gray-700">
                          {grade !== null && grade !== undefined ? grade : '—'}
                        </div>
                      </td>
                    );
                  })}
                  <td className="w-4" aria-hidden="true"></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};


