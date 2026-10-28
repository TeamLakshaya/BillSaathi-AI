import React from 'react';
import { MedicalCase } from '../../types';
import { Badge } from '../common/Badge';
import { Icon } from '../common/Icon';
import { Button } from '../common/Button';
import { money, date } from '../../utils/formatters';

interface CaseTableProps {
  cases: MedicalCase[];
  isDemo?: boolean;
  onOpenCase: (id: string) => void;
  onDeleteCase?: (id: string) => void;
  manage?: boolean;
}

export const CaseTable: React.FC<CaseTableProps> = ({
  cases,
  isDemo,
  onOpenCase,
  onDeleteCase,
  manage = true
}) => {
  if (!cases.length) {
    return (
      <div className="empty">
        <Icon name="file" />
        <h3>No cases found</h3>
        <p>Create a case or adjust your search and filters.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>CASE / PROVIDER</th>
            <th>BILL AMOUNT</th>
            <th>LAST UPDATED</th>
            <th>CURRENT STAGE</th>
            <th>ACTION</th>
            {manage && <th></th>}
          </tr>
        </thead>
        <tbody>
          {cases.map(c => (
            <tr key={c.id}>
              <td>
                <strong>{c.name}</strong>
                <small>
                  {c.id} · {c.hospital} {isDemo && '· Demo Data'}
                </small>
              </td>
              <td className="money">{money(c.amount)}</td>
              <td>{date(c.updated)}</td>
              <td>
                <Badge>{c.stage}</Badge>
              </td>
              <td>
                <Button variant="text-link" onClick={() => onOpenCase(c.id)}>
                  View case
                </Button>
              </td>
              {manage && (
                <td>
                  {onDeleteCase && (
                    <Button
                      variant="ghost small danger"
                      aria-label="Delete case"
                      onClick={() => onDeleteCase(c.id)}
                    >
                      <Icon name="trash" />
                    </Button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
