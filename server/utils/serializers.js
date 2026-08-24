export const serializeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const serializeAddress = (address) => ({
  id: address._id.toString(),
  label: address.label,
  fullName: address.fullName,
  phone: address.phone,
  line1: address.line1,
  line2: address.line2,
  city: address.city,
  state: address.state,
  postalCode: address.postalCode,
  country: address.country,
  isDefault: address.isDefault,
  createdAt: address.createdAt,
  updatedAt: address.updatedAt,
});
