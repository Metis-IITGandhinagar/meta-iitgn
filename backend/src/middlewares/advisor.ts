import express from "express";

const adviserOnly = (req:express.Request, res:express.Response, next:express.NextFunction) => {
  if (req.user.role !== "ADVISER") {
    return res
      .status(403)
      .json({ message: "Only advisers can post" });
  }

  next();
};

export default adviserOnly;