import { createCreateExamResult, type CreateExamInput } from "@/features/exams/create/contracts";

type CreateExamDependencies = {
  insertExam(input: {
    userId: string;
    subjectId: string;
    gradeLevelId: string;
    topic: string | null;
    status: "uploading";
  }): Promise<{
    data: { id: string } | null;
    error: { message: string } | null;
  }>;
  updateExam(input: {
    examId: string;
    patch: {
      pdfPath?: string;
      status?: "extracting";
    };
  }): Promise<{
    error: { message: string } | null;
  }>;
  deleteExam(input: { examId: string }): Promise<{
    error: { message: string } | null;
  }>;
  deletePdf(input: { filePath: string }): Promise<{
    error: { message: string } | null;
  }>;
  insertExamSupports(input: {
    examId: string;
    supportIds: string[];
  }): Promise<{
    error: { message: string } | null;
  }>;
  uploadPdf(input: {
    filePath: string;
    fileData: Uint8Array;
    contentType: string;
  }): Promise<{
    error: { message: string } | null;
  }>;
  invokeExtraction(input: {
    examId: string;
    initiatedBy: string;
    pdfPath: string;
    pdfData: Uint8Array;
    contentType: string;
  }): Promise<{
    error: { message: string } | null;
  }>;
};

type CreateExamOptions = {
  actorUserId: string;
  input: CreateExamInput & {
    uploadedPdf: CreateExamInput["uploadedPdf"] & {
      fileData: Uint8Array;
    };
  };
  dependencies: CreateExamDependencies;
};

export async function createExam({
  actorUserId,
  input,
  dependencies,
}: CreateExamOptions) {
  async function rollbackCreatedExam(examId: string, pdfPath?: string) {
    if (pdfPath) {
      await dependencies.deletePdf({
        filePath: pdfPath,
      });
    }

    await dependencies.deleteExam({
      examId,
    });
  }

  const examResult = await dependencies.insertExam({
    userId: actorUserId,
    subjectId: input.subjectId,
    gradeLevelId: input.gradeLevelId,
    topic: input.topic ?? null,
    status: "uploading",
  });

  if (examResult.error || !examResult.data) {
    throw new Error("Erro ao criar exame.");
  }

  const pdfPath = `${actorUserId}/${examResult.data.id}.pdf`;
  const uploadResult = await dependencies.uploadPdf({
    filePath: pdfPath,
    fileData: input.uploadedPdf.fileData,
    contentType: input.uploadedPdf.fileType,
  });

  if (uploadResult.error) {
    await rollbackCreatedExam(examResult.data.id);

    throw new Error("Erro no upload do PDF.");
  }

  const supportIds = input.supportSelections.map((support) => support.supportId);
  const supportsResult = await dependencies.insertExamSupports({
    examId: examResult.data.id,
    supportIds,
  });

  if (supportsResult.error) {
    await rollbackCreatedExam(examResult.data.id, pdfPath);
    throw new Error("Erro ao salvar os apoios do exame.");
  }

  const updateResult = await dependencies.updateExam({
    examId: examResult.data.id,
    patch: {
      pdfPath,
      status: "extracting",
    },
  });

  if (updateResult.error) {
    await rollbackCreatedExam(examResult.data.id, pdfPath);
    throw new Error("Erro ao atualizar o status do exame.");
  }

  const extractionResult = await dependencies.invokeExtraction({
    examId: examResult.data.id,
    initiatedBy: actorUserId,
    pdfPath,
    pdfData: input.uploadedPdf.fileData,
    contentType: input.uploadedPdf.fileType,
  });

  if (extractionResult.error) {
    await rollbackCreatedExam(examResult.data.id, pdfPath);
    throw new Error("Erro ao iniciar a extração.");
  }

  return createCreateExamResult({
    examId: examResult.data.id,
    status: "extracting",
    pdfPath,
  });
}
