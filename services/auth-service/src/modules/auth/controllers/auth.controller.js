import { User } from "../models/user.model.js";
import { createInitialProfile } from "@finboard/contracts";
import { sendPhoneOtp, verifyPhoneOtp, verifyPhoneOtpDetailed } from "../services/otp.service.js";
import { sendPasswordResetOtp, verifyPasswordResetOtp } from "../services/email.service.js";
import { signJwt } from "../../../common/helpers/jwt.helper.js";

export async function sendOtp(req, res, next) {
  try {
    const phone = req.body.phone;
    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({ message: "No account registered with this phone number" });
    }

    const result = await sendPhoneOtp(phone);
    return res.json({
      message: "OTP sent successfully",
      provider: result.provider,
      sid: result.sid,
      status: result.status,
      to: result.to,
      channel: result.channel
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyOtp(req, res, next) {
  try {
    const result = await verifyPhoneOtpDetailed(req.body.phone, req.body.otp);

    if (!result.approved) {
      return res.json({
        message: "Invalid or expired OTP",
        registrationComplete: false,
        ...result
      });
    }

    const pendingUser = await User.findOne({ phone: req.body.phone, phoneVerified: false });

    if (pendingUser) {
      pendingUser.phoneVerified = true;
      pendingUser.lastLoginAt = new Date();
      await pendingUser.save();

      await createInitialProfile({
        userId: pendingUser._id,
        fullName: pendingUser.name,
        mobileNumber: pendingUser.phone,
        emailAddress: pendingUser.email
      }).catch(() => {});

      return res.json({
        message: "Registration complete",
        registrationComplete: true,
        token: signJwt(pendingUser),
        user: pendingUser.toSafeJSON(),
        ...result
      });
    }

    return res.json({
      message: "OTP verified successfully",
      registrationComplete: false,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

export async function signup(req, res, next) {
  try {
    const { name, email, phone, password } = req.body;

    const existing = await User.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      if (!existing.phoneVerified) {
        return res.status(409).json({
          message: "An account with this email or phone is pending verification. Verify OTP or use a different email/phone."
        });
      }
      return res.status(409).json({ message: "Email or phone number is already registered" });
    }

    const user = new User({
      name,
      email,
      phone,
      phoneVerified: false
    });
    await user.setPassword(password);
    await user.save();

    await sendPhoneOtp(phone);

    return res.status(201).json({
      message: "Account created. OTP sent to your phone for verification.",
      requiresPhoneVerification: true,
      registrationComplete: false,
      user: user.toSafeJSON()
    });
  } catch (error) {
    next(error);
  }
}

export async function signin(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.phoneVerified) {
      return res.status(403).json({ message: "Complete phone verification before signing in" });
    }

    user.lastLoginAt = new Date();
    await user.save();

    return res.json({ token: signJwt(user), user: user.toSafeJSON() });
  } catch (error) {
    next(error);
  }
}

export async function adminSignin(req, res, next) {
  try {
    const { email, password, adminRole } = req.body;
    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid admin email or password" });
    }

    if (!user.phoneVerified) {
      return res.status(403).json({ message: "Complete phone verification before signing in" });
    }

    if (!["admin", "rta_admin", "amc_admin"].includes(user.role)) {
      return res.status(403).json({ message: "This account is not allowed to access the admin dashboard" });
    }

    if (adminRole && adminRole !== "admin" && user.role !== adminRole) {
      return res.status(403).json({ message: "Selected admin role does not match this account" });
    }

    user.lastLoginAt = new Date();
    await user.save();

    return res.json({ token: signJwt(user), user: user.toSafeJSON() });
  } catch (error) {
    next(error);
  }
}

export async function phoneLogin(req, res, next) {
  try {
    const user = await User.findOne({ phone: req.body.phone });

    if (!user) {
      return res.status(404).json({ message: "No account registered with this phone number" });
    }

    if (!user.phoneVerified) {
      return res.status(403).json({ message: "Complete phone verification before signing in" });
    }

    const otpVerified = await verifyPhoneOtp(req.body.phone, req.body.otp);

    if (!otpVerified) {
      return res.status(401).json({ message: "Invalid or expired OTP" });
    }

    user.lastLoginAt = new Date();
    await user.save();

    return res.json({ token: signJwt(user), user: user.toSafeJSON() });
  } catch (error) {
    next(error);
  }
}

export async function me(req, res) {
  return res.json({ user: req.user.toSafeJSON() });
}

export async function changePassword(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select("+passwordHash");

    if (!user || !(await user.comparePassword(req.body.currentPassword))) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    await user.setPassword(req.body.newPassword);
    await user.save();

    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const result = await sendPasswordResetOtp(email);
    return res.json({
      message: "If an account exists with that email, a reset code has been sent",
      provider: result.provider
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");

    if (!user) {
      return res.status(400).json({ message: "Invalid reset request" });
    }

    const { valid, reason } = verifyPasswordResetOtp(email, otp);

    if (!valid) {
      const message = reason === "expired" ? "Reset code has expired" : "Invalid reset code";
      return res.status(400).json({ message });
    }

    await user.setPassword(newPassword);
    await user.save();

    return res.json({ message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
}
