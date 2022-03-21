import mongoose from "mongoose";

const feesSchema = new mongoose.Schema({
    feeId: String,
    feeCurrency: String,
    feeLocale: String,
    feeEntity: String,
    entityProperty: String,
    feeType: String,
    feeValue: String
});

export default mongoose.model("fees", feesSchema);