import mongoose, { Schema, models, model } from "mongoose";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  email: string;
  name?: string;
  image?: string;
  credits: number;
  wishlist: Array<{
    id: string;
    title: string;
    imageUrl?: string;
    linkUrl?: string;
    source?: string;
    priceText?: string;
    createdAt: Date;
  }>;
}

const WishlistItemSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    imageUrl: String,
    linkUrl: String,
    source: String,
    priceText: String,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  name: String,
  image: String,
  credits: { type: Number, default: 5 },
  wishlist: { type: [WishlistItemSchema], default: [] },
});

export const UserModel = models.User || model<IUser>("User", UserSchema);


