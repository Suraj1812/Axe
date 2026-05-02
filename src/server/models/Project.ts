import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const projectSchema = new Schema(
  {
    projectId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    ownerId: { type: String, default: null, index: true },
    scene: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

projectSchema.index({ projectId: 1, ownerId: 1 }, { unique: true });

export type ProjectRecord = InferSchemaType<typeof projectSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ProjectModel =
  (mongoose.models.Project as Model<ProjectRecord> | undefined) ??
  mongoose.model<ProjectRecord>("Project", projectSchema);
