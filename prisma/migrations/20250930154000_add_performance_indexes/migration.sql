-- Add performance indexes for better query performance

-- User table indexes
CREATE INDEX "User_companyId_idx" ON "User"("companyId");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_isActive_idx" ON "User"("isActive");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- Project table indexes
CREATE INDEX "Project_companyId_idx" ON "Project"("companyId");
CREATE INDEX "Project_status_idx" ON "Project"("status");
CREATE INDEX "Project_priority_idx" ON "Project"("priority");
CREATE INDEX "Project_creatorId_idx" ON "Project"("creatorId");
CREATE INDEX "Project_createdAt_idx" ON "Project"("createdAt");
CREATE INDEX "Project_startDate_idx" ON "Project"("startDate");
CREATE INDEX "Project_endDate_idx" ON "Project"("endDate");

-- Task table indexes
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");
CREATE INDEX "Task_status_idx" ON "Task"("status");
CREATE INDEX "Task_priority_idx" ON "Task"("priority");
CREATE INDEX "Task_creatorId_idx" ON "Task"("creatorId");
CREATE INDEX "Task_createdAt_idx" ON "Task"("createdAt");
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");
CREATE INDEX "Task_completedAt_idx" ON "Task"("completedAt");

-- Document table indexes
CREATE INDEX "Document_projectId_idx" ON "Document"("projectId");
CREATE INDEX "Document_creatorId_idx" ON "Document"("creatorId");
CREATE INDEX "Document_createdAt_idx" ON "Document"("createdAt");
CREATE INDEX "Document_mimeType_idx" ON "Document"("mimeType");
CREATE INDEX "Document_isLatest_idx" ON "Document"("isLatest");
CREATE INDEX "Document_documentNumber_idx" ON "Document"("documentNumber");

-- Finance table indexes
CREATE INDEX "Finance_projectId_idx" ON "Finance"("projectId");
CREATE INDEX "Finance_type_idx" ON "Finance"("type");
CREATE INDEX "Finance_date_idx" ON "Finance"("date");
CREATE INDEX "Finance_createdAt_idx" ON "Finance"("createdAt");

-- ChatMessage table indexes
CREATE INDEX "ChatMessage_projectId_idx" ON "ChatMessage"("projectId");
CREATE INDEX "ChatMessage_userId_idx" ON "ChatMessage"("userId");
CREATE INDEX "ChatMessage_createdAt_idx" ON "ChatMessage"("createdAt");

-- TaskComment table indexes
CREATE INDEX "TaskComment_taskId_idx" ON "TaskComment"("taskId");
CREATE INDEX "TaskComment_userId_idx" ON "TaskComment"("userId");
CREATE INDEX "TaskComment_createdAt_idx" ON "TaskComment"("createdAt");

-- Approval table indexes
CREATE INDEX "Approval_projectId_idx" ON "Approval"("projectId");
CREATE INDEX "Approval_status_idx" ON "Approval"("status");
CREATE INDEX "Approval_type_idx" ON "Approval"("type");
CREATE INDEX "Approval_createdAt_idx" ON "Approval"("createdAt");

-- Notification table indexes
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_type_idx" ON "Notification"("type");
CREATE INDEX "Notification_read_idx" ON "Notification"("read");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
