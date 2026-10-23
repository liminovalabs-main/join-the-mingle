import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { extractErrorMessage } from "@/lib/api/client";
import { AxiosError, InternalAxiosRequestConfig } from "axios";

describe("API Client & Error Handler", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("extracts error message from structured DRF envelope { error: { message } }", () => {
    const error = new AxiosError("Request failed with status code 400");
    error.response = {
      data: {
        error: {
          code: "ValidationError",
          message: "Account already exists with this email address.",
        },
      },
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    };

    expect(extractErrorMessage(error)).toBe(
      "Account already exists with this email address."
    );
  });

  it("extracts field-level DRF validation errors array { error: { details: { email: [...] } } }", () => {
    const error = new AxiosError("Validation error");
    error.response = {
      data: {
        error: {
          details: {
            email: ["Enter a valid email address."],
          },
        },
      },
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    };

    expect(extractErrorMessage(error)).toBe("Enter a valid email address.");
  });

  it("extracts standard flat DRF field errors e.g. { password: ['Too short'] }", () => {
    const error = new AxiosError("Validation error");
    error.response = {
      data: {
        password: ["This password is too short."],
      },
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    };

    expect(extractErrorMessage(error)).toBe("password: This password is too short.");
  });

  it("provides fallback for non-Axios generic exceptions", () => {
    expect(extractErrorMessage(new Error("Network disconnect"))).toBe(
      "An unexpected error occurred. Please try again."
    );
    expect(extractErrorMessage(null)).toBe(
      "An unexpected error occurred. Please try again."
    );
  });
});
