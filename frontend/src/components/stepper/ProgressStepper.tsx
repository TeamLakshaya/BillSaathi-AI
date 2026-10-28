import React from 'react';
import { MedicalCase } from '../../types';
import { stages } from '../../utils/constants';
import { stageHelp } from '../../utils/formatters';
import { Icon } from '../common/Icon';

interface ProgressStepperProps {
  caseObj?: MedicalCase;
}

export const ProgressStepper: React.FC<ProgressStepperProps> = ({ caseObj }) => {
  if (!caseObj) return null;
  const p = caseObj.progress;

  return (
    <div className="steps">
      {stages.map((s, i) => {
        const isDone = i < p;
        const isCurrent = i === p;
        const statusClass = isDone ? 'done' : isCurrent ? 'current' : '';
        const [firstWord, ...restWords] = s.split(' ');

        return (
          <div key={s} className={`step ${statusClass}`.trim()} title={stageHelp(i)}>
            <div className="step-dot">
              {isDone ? <Icon name="check" /> : i + 1}
            </div>
            <span>
              {firstWord}
              <br />
              {restWords.join(' ')}
            </span>
          </div>
        );
      })}
    </div>
  );
};
