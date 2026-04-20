import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.js";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, EMAIL_ENABLED } from "../configs/env.js";
import { emailQueue } from "../configs/emailQueue.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const googleId = profile.id;

        let user = await User.findOne({ googleId });
        if (user) {
          return done(null, user);
        }

        user = await User.findOne({ email });
        if (user) {
          user.googleId = googleId;
          if (!user.provider.includes("google")) {
            user.provider.push("google");
          }
          await user.save();

          return done(null, user);
        }

        if (!user) {
          user = await User.create({
            googleId,
            username: profile.displayName,
            email,
            provider: "google"
          });

          if (EMAIL_ENABLED) {
            emailQueue.add({
              type: "SIGNUP",
              data: {
                to: user.email,
                name: user.username,
              }
            },
              {
                attempts: 3,
                backoff: 30000,
              });
          }
        }

        return done(null, user);
      }
      catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport;