import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { MedicalCase } from '../types';
import { objectiveOptions } from '../utils/constants';
import { money, date } from '../utils/formatters';
import { Icon } from '../components/common/Icon';
import { Button } from '../components/common/Button';

export const CaseWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cases, addCase, updateCase, isDemo, showToast, addActivity } = useWorkspace();

  const editId = searchParams.get('edit');
  const existingCase = editId ? cases.find(c => c.id === editId) : undefined;

  const [wizardStep, setWizardStep] = useState<number>(1);
  const [formData, setFormData] = useState<Partial<MedicalCase>>({
    name: '',
    hospital: '',
    city: '',
    amount: 0,
    date: '',
    admission: '',
    discharge: '',
    insurance: 'Insured',
    description: '',
    objectives: []
  });
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (existingCase) {
      setFormData(existingCase);
    }
  }, [existingCase]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? (value ? Number(value) : '') : value
    }));
    setError('');
  };

  const handleObjectiveToggle = (obj: string) => {
    setFormData(prev => {
      const current = prev.objectives || [];
      const updated = current.includes(obj)
        ? current.filter(x => x !== obj)
        : [...current, obj];
      return { ...prev, objectives: updated };
    });
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (wizardStep === 1) {
      if (!formData.name?.trim() || !formData.hospital?.trim() || !formData.amount) {
        setError('Please complete all required fields.');
        return;
      }
      if (
        formData.admission &&
        formData.discharge &&
        formData.discharge < formData.admission
      ) {
        setError('Discharge date must not be before admission date.');
        return;
      }
      setError('');
      setWizardStep(2);
    } else if (wizardStep === 2) {
      if (!formData.objectives || formData.objectives.length === 0) {
        setError('Select at least one review objective.');
        return;
      }
      setError('');
      setWizardStep(3);
    } else {
      const isEdit = !!existingCase;
      const caseId = existingCase?.id || 'LOCAL-' + Date.now().toString().slice(-6);

      const finalCase: MedicalCase = {
        id: caseId,
        name: formData.name || 'Untitled Case',
        hospital: formData.hospital || 'Unspecified Provider',
        city: formData.city || '',
        amount: Number(formData.amount) || 0,
        currency: 'INR',
        date: formData.date || '',
        admission: formData.admission || '',
        discharge: formData.discharge || '',
        updated: new Date().toISOString().slice(0, 10),
        stage: existingCase?.stage || 'Awaiting Documents',
        progress: existingCase?.progress || 1,
        description: formData.description || '',
        insurance: formData.insurance || 'Self-paid',
        objectives: formData.objectives || []
      };

      if (isEdit) {
        updateCase(caseId, finalCase);
        addActivity('Case details updated locally');
      } else {
        addCase(finalCase);
        addActivity('Case created locally');
      }

      showToast('Case saved in this tab. No server request was made.');
      navigate('/detail');
    }
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>{existingCase ? 'Edit your case' : 'Start a new bill review'}</h1>
          <p>A few details will help keep your documents and review organized.</p>
        </div>
      </div>

      <div className="card padded" style={{ maxWidth: '900px' }}>
        <div className="wizard-top">
          {['Case information', 'Review objectives', 'Review & create'].map((s, i) => (
            <span
              key={s}
              className={
                wizardStep === i + 1
                  ? 'active'
                  : wizardStep > i + 1
                  ? 'complete'
                  : undefined
              }
            >
              {i + 1}. {s}
            </span>
          ))}
        </div>

        <form id="wizard-form" onSubmit={handleSubmit}>
          {wizardStep === 1 && (
            <div className="form-grid">
              <div>
                <label htmlFor="f-name">Case name *</label>
                <input
                  id="f-name"
                  name="name"
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="f-hospital">Hospital or healthcare provider *</label>
                <input
                  id="f-hospital"
                  name="hospital"
                  type="text"
                  required
                  value={formData.hospital || ''}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="f-city">Hospital city</label>
                <input
                  id="f-city"
                  name="city"
                  type="text"
                  value={formData.city || ''}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="f-amount">Total bill amount *</label>
                <input
                  id="f-amount"
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formData.amount || ''}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="f-admission">Admission date</label>
                <input
                  id="f-admission"
                  name="admission"
                  type="date"
                  value={formData.admission || ''}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="f-discharge">Discharge date</label>
                <input
                  id="f-discharge"
                  name="discharge"
                  type="date"
                  value={formData.discharge || ''}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="f-date">Bill date</label>
                <input
                  id="f-date"
                  name="date"
                  type="date"
                  value={formData.date || ''}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="insurance">Insurance status</label>
                <select
                  name="insurance"
                  id="insurance"
                  value={formData.insurance || 'Insured'}
                  onChange={handleChange}
                >
                  {['Insured', 'Self-paid', 'Partially insured'].map(v => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div className="wide">
                <label htmlFor="description">What would you like to understand?</label>
                <textarea
                  name="description"
                  id="description"
                  placeholder="Describe the bill or the concern in your own words."
                  value={formData.description || ''}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div>
              <h3 style={{ fontSize: '15px', marginBottom: '6px' }}>
                What would you like to review?
              </h3>
              <p className="note-text" style={{ marginBottom: '16px' }}>
                Select one or more objectives. You can update these later.
              </p>
              {objectiveOptions.map(v => (
                <label key={v} className="check">
                  <input
                    type="checkbox"
                    name="objectives"
                    value={v}
                    checked={(formData.objectives || []).includes(v)}
                    onChange={() => handleObjectiveToggle(v)}
                  />
                  {v}
                </label>
              ))}
            </div>
          )}

          {wizardStep === 3 && (
            <div>
              <h3 style={{ fontSize: '15px', marginBottom: '6px' }}>
                Check your case details
              </h3>
              <div className="notice">
                {isDemo
                  ? 'This case will be added to the separate demo session. Use fictional details only.'
                  : 'This case stays only in this tab. Refreshing or closing it will clear the workspace.'}
              </div>
              <div className="form-grid">
                {[
                  ['Case name', formData.name],
                  ['Provider', formData.hospital],
                  ['City', formData.city],
                  ['Bill amount', money(formData.amount)],
                  ['Bill date', date(formData.date)],
                  ['Insurance', formData.insurance]
                ].map(([k, v]) => (
                  <div key={k}>
                    <label>{k}</label>
                    <span style={{ fontWeight: 600 }}>{v || 'Not provided'}</span>
                  </div>
                ))}
                <div className="wide">
                  <label>Review objectives</label>
                  {(formData.objectives || []).map(v => (
                    <p key={v} className="note-text">
                      <Icon name="check" /> {v}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          <p id="wizard-error" className="error" role="alert">
            {error}
          </p>

          <div
            className="actions"
            style={{ justifyContent: 'space-between', marginTop: '24px' }}
          >
            {wizardStep > 1 ? (
              <Button type="button" onClick={() => setWizardStep(s => s - 1)}>
                Back
              </Button>
            ) : (
              <Button type="button" onClick={() => navigate('/cases')}>
                Cancel
              </Button>
            )}

            <button type="submit" className="primary">
              {wizardStep < 3
                ? 'Continue'
                : existingCase
                ? 'Save case locally'
                : 'Create case locally'}{' '}
              <Icon name="arrow" />
            </button>
          </div>
        </form>

        <p className="inline-note">
          No backend is connected. Progress is retained only while this tab remains open.
        </p>
      </div>
    </>
  );
};
