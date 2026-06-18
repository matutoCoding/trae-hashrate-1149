import type { Qualification, QualificationStatus } from '@shared/types';
import { mockQualifications } from './mockData';

export function getQualificationsByUser(userId: string): Qualification[] {
  return mockQualifications
    .filter(q => q.userId === userId)
    .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
}

export function getQualificationById(id: string): Qualification | undefined {
  return mockQualifications.find(q => q.id === id);
}

export function checkUserQualification(
  userId: string,
  qualificationType: string
): { valid: boolean; qualification?: Qualification } {
  const now = new Date();
  const qualification = mockQualifications.find(
    q =>
      q.userId === userId &&
      q.type === qualificationType &&
      q.status === 'approved' &&
      new Date(q.expiryDate) > now
  );
  return { valid: !!qualification, qualification };
}

export function getUserQualificationStatus(
  userId: string,
  qualificationType: string
): 'none' | 'pending' | 'approved' | 'expired' | 'rejected' {
  const qualifications = mockQualifications.filter(
    q => q.userId === userId && q.type === qualificationType
  );

  if (qualifications.length === 0) return 'none';

  const now = new Date();
  const valid = qualifications.find(
    q => q.status === 'approved' && new Date(q.expiryDate) > now
  );
  if (valid) return 'approved';

  const pending = qualifications.find(q => q.status === 'pending');
  if (pending) return 'pending';

  const expired = qualifications.find(
    q => q.status === 'approved' && new Date(q.expiryDate) <= now
  );
  if (expired) return 'expired';

  const rejected = qualifications.find(q => q.status === 'rejected');
  if (rejected) return 'rejected';

  return 'none';
}

export function applyQualification(
  data: Omit<Qualification, 'id' | 'status'>
): Qualification {
  const newQualification: Qualification = {
    ...data,
    id: `QUAL${String(mockQualifications.length + 1).padStart(3, '0')}`,
    status: 'pending'
  };
  mockQualifications.push(newQualification);
  return newQualification;
}

export function reviewQualification(
  id: string,
  status: Exclude<QualificationStatus, 'pending'>
): Qualification | null {
  const qualification = mockQualifications.find(q => q.id === id);
  if (!qualification) return null;
  qualification.status = status;
  return qualification;
}

export function getPendingQualifications(): Qualification[] {
  return mockQualifications
    .filter(q => q.status === 'pending')
    .sort(
      (a, b) => new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime()
    );
}

export const qualificationTypes = [
  { type: 'Q1', name: '电子显微镜操作资质', description: 'TEM/SEM操作' },
  { type: 'Q2', name: 'X射线衍射仪操作资质', description: 'XRD操作' },
  { type: 'Q3', name: '核磁共振仪操作资质', description: 'NMR操作' }
];

export function getQualificationTypeInfo(type: string) {
  return qualificationTypes.find(t => t.type === type);
}
