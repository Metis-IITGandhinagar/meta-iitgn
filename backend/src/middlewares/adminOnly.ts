import express from 'express';

const adminOnly = (req:express.Request, res:express.Response, next:express.NextFunction) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      message: "Admin only"
    });
  }

  next();
};

export default adminOnly;