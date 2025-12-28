import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { useTranslation } from 'react-i18next';

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const [contactEmail, setContactEmail] = useState('admin@email.com');

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold text-text mb-6">{t('adminDashboard.settings', 'Configuración')}</h1>
      <Card className="p-6">
        <form className="space-y-4">
          <div>
            <label className="block text-text font-medium mb-1">Email de Contacto</label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={contactEmail}
              onChange={e => setContactEmail(e.target.value)}
            />
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Settings; 