import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// A "schema" describes the SHAPE of a user document and the rules each field must follow.
const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: [true, "Name is required"], trim: true, maxlength: 80 },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true, // creates a database index so two users can't share an email
            lowercase: true, // "Asha@X.com" and "asha@x.com" become the same
            trim: true,
        },
        // select: false means queries do NOT return this field unless explicitly requested.
        password: { type: String, required: true, minlength: 8, select: false },
        role: { type: String, enum: ["donor", "ngo"], required: true }, // 'admin' is impossible by design
        organization: { type: String, trim: true, maxlength: 120 },
    },
    { timestamps: true } // Mongoose adds createdAt and updatedAt automatically
);

// A "pre save hook": runs automatically just before a user is saved.
userSchema.pre("save", async function () {
    // Only re-hash if the password changed (not when updating, say, the name).
    if (!this.isModified("password")) return;
    // 12 = the "cost": higher is slower to compute, so harder for attackers to brute-force.
    this.password = await bcrypt.hash(this.password, 12);
});

// A method every user document gets: compares a typed password with the stored hash.
userSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// When a user is turned into JSON (for responses), strip sensitive/internal fields.
userSchema.set("toJSON", {
    transform: (doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
    },
});

export default mongoose.model("User", userSchema);
