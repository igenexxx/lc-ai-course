export default function handler(req, res) {
  const lastName = req.body.lastName?.toUpperCase();
  res.status(200).json({ lastName });
}
