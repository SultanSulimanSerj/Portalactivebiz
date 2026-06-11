import { prisma } from './prisma'

export interface CompanyAccessUser {
  companyId: string | null
}

export async function verifyTaskCompanyAccess(
  user: CompanyAccessUser,
  taskId: string
): Promise<boolean> {
  if (!user.companyId) return false
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      OR: [
        { companyId: user.companyId },
        { project: { companyId: user.companyId } },
      ],
    },
    select: { id: true },
  })
  return !!task
}

export async function verifyFinanceCompanyAccess(
  user: CompanyAccessUser,
  financeId: string
): Promise<boolean> {
  if (!user.companyId) return false
  const record = await prisma.finance.findFirst({
    where: {
      id: financeId,
      OR: [
        { companyId: user.companyId },
        { project: { companyId: user.companyId } },
      ],
    },
    select: { id: true },
  })
  return !!record
}

export async function verifyUserCompanyAccess(
  user: CompanyAccessUser,
  targetUserId: string
): Promise<boolean> {
  if (!user.companyId) return false
  const target = await prisma.user.findFirst({
    where: { id: targetUserId, companyId: user.companyId },
    select: { id: true },
  })
  return !!target
}

export async function verifyProjectCompanyAccess(
  user: CompanyAccessUser,
  projectId: string
): Promise<boolean> {
  if (!user.companyId) return false
  const project = await prisma.project.findFirst({
    where: { id: projectId, companyId: user.companyId },
    select: { id: true },
  })
  return !!project
}

export async function verifyApprovalCompanyAccess(
  user: CompanyAccessUser,
  approvalId: string
): Promise<boolean> {
  if (!user.companyId) return false
  const approval = await prisma.approval.findFirst({
    where: { id: approvalId, companyId: user.companyId },
    select: { id: true },
  })
  return !!approval
}

export async function verifyEstimateAccess(
  user: CompanyAccessUser,
  projectId: string,
  estimateId: string
): Promise<boolean> {
  if (!user.companyId) return false
  const estimate = await prisma.estimate.findFirst({
    where: {
      id: estimateId,
      projectId,
      project: { companyId: user.companyId },
    },
    select: { id: true },
  })
  return !!estimate
}
