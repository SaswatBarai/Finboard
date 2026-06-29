import { UserProfile } from "../models/profile.model.js";

function normalizeDate(value) {
  if (!value) {
    return undefined;
  }

  return new Date(value);
}

export async function getProfile(req, res, next) {
  try {
    const profile = await UserProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        $setOnInsert: {
          fullName: req.user.name,
          mobileNumber: req.user.phone,
          emailAddress: req.user.email
        }
      },
      { new: true, upsert: true }
    );

    return res.json({ profile });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const data = { ...req.body };

    if ("dateOfBirth" in data) {
      data.dateOfBirth = normalizeDate(data.dateOfBirth);
    }

    if (data.pan) {
      data.pan = data.pan.toUpperCase();
    }

    if (data.bank?.ifsc) {
      data.bank.ifsc = data.bank.ifsc.toUpperCase();
    }

    const profile = await UserProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: data },
      { new: true, upsert: true, runValidators: true }
    );

    return res.json({ profile });
  } catch (error) {
    next(error);
  }
}

