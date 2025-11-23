import { z } from "zod";
import {
  addLink,
  getLinkByCode,
  deleteLink,
  incrementClicks,
  listLinks,
} from "../models/linkModels.js";
import AppError from "../utils/errorhandler.js";
import HttpStatusCodes from "../constants/httpCodes.js";
import catchAsync from "../utils/catchAsync.js";

// code - shortLink Schema using Zod
const linkSchema = z.object({
  url: z.url("Invalid URL format"),
  code: z
    .string()
    .min(6, "Code must be at least 6 characters long")
    .max(8, "Code must be at most 8 characters long")
    .regex(/^[a-zA-Z0-9]*$/, "Code must be alphanumeric")
    .optional(),
});

const generateRandomCode = (length = 6) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const createTinyLink = catchAsync(async (req, res) => {
  // Logic to create a tiny link

  const parsedData = linkSchema.safeParse(req.body);
  if (!parsedData.success) {
    const validationErrors = parsedData.error.flatten();
    throw new AppError(
      HttpStatusCodes.BAD_REQUEST,
      JSON.stringify(validationErrors)
    );
  }

  const { url, code } = parsedData.data;

  if (code) {
    const response = await addLink(code, url);
    return res.status(HttpStatusCodes.CREATED).json({
      status: "Success",
      data: response,
    });
  } else {
    let retryCount = 0;
    const MAX_RETRY = 10;
    while (retryCount < MAX_RETRY) {
      try {
        const randomCode = generateRandomCode(6);
        const response = await addLink(randomCode, url);
        return res.status(HttpStatusCodes.CREATED).json({
          status: "Success",
          data: response,
        });
      } catch (error) {
        if (error.statusCode !== HttpStatusCodes.CONFLICT) {
          retryCount++;
          continue;
        }
        throw error;
      }
    }
  }
});
/* ..................................................... */

export const getTinyLinkList = catchAsync(async (req, res) => {
  const search = req.query.search || "";
  const response = await listLinks(search);

  if (response.length === 0) {
    throw new AppError(HttpStatusCodes.NOT_FOUND, "No links found");
  }
  return res.status(HttpStatusCodes.OK).json({
    status: "Success",
    results: response.length,
    data: response,
  });
});

/* ..................................................... */

export const getSingleTinyLinkDetails = catchAsync(async (req, res) => {
  const { code } = req.params;
  const parsedData = linkSchema.pick({ code: true }).safeParse({ code });

  if (!parsedData.success) {
    const validationErrors = parsedData.error.flatten();

    throw new AppError(
      HttpStatusCodes.BAD_REQUEST,
      JSON.stringify(validationErrors)
    );
  }
  const response = await getLinkByCode(code);

  if (!response) {
    throw new AppError(HttpStatusCodes.NOT_FOUND, "Invalid Short Code");
  }
  return res.status(HttpStatusCodes.OK).json({
    status: "Success",
    data: response,
  });
});

/* ..................................................... */
export const deleteTinyLink = catchAsync(async (req, res) => {
  // Logic to delete a tiny link by code
  const { code } = req.params;
  const parsedData = linkSchema.pick({ code: true }).safeParse({ code });

  if (!parsedData.success) {
    const validationErrors = parsedData.error.flatten();
    throw new AppError(
      HttpStatusCodes.BAD_REQUEST,
      JSON.stringify(validationErrors)
    );
  }
  const response = await deleteLink(code);

  if (!response) {
    throw new AppError(HttpStatusCodes.NOT_FOUND, "Invalid Short Code");
  }
  return res.status(HttpStatusCodes.OK).json({
    status: "Success",
    data: response,
  });
});

/* ..................................................... */
export const redirectToOriginalUrl = catchAsync(async (req, res) => {
  const { code } = req.params;
  const response = await getLinkByCode(code);
  if (!response) {
    throw new AppError(HttpStatusCodes.NOT_FOUND, "Invalid Short Code");
  }

  const result = await incrementClicks(code);
  if (!result) {
    throw new AppError(
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
      "Could not update click count"
    );
  }
  return res.status(HttpStatusCodes.FOUND).redirect(response.url);
});

/* ..................................................... */

export const healthCheck = catchAsync(async (req, res) => {
  return res.status(HttpStatusCodes.OK).json({
    status: "Success",
    ok: "true",
    version: "1.0.0",
  });
});
