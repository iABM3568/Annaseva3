import mongoose from "mongoose";

// Stops garbage like /api/listings/abc/claim before it reaches the database.
// Without this, Mongoose throws a CastError and the client gets a confusing 500.
export function validateId(req, res, next) {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid listing id" });
    }
    next();
}
