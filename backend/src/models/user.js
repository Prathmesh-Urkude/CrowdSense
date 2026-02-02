import mongoose from 'mongoose';
import argon2 from 'argon2';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },

}, { timestamps: true });

userSchema.pre('save', async function(next){
    const user = this;
    if(!user.isModified('password')) return;

    this.password = await argon2.hash(user.password);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return argon2.verify(this.password, candidatePassword);
};

const User = mongoose.model('User', userSchema);

export default User;