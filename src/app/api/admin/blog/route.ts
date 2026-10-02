import { NextResponse } from "next/server";
import { toAdminErrorResponse } from "@/features/admin/lib/admin-route";
import { apiEndpoints, requestAdmin } from "@/features/admin/lib/admin-api";
import { getAdminAccessToken } from "@/features/auth/lib/session";
import { ApiError } from "@/services/http/api-error";
import { upsertBlogPostSchema } from "@/features/blog/lib/blog-admin.schema";
import {
  parseBlogContentJson,
  sanitizeBlogContentDocument,
  stringifyBlogContentDocument,
} from "@/features/blog/lib/block-content";

export async function GET() {
  try {
    const data = await requestAdmin(apiEndpoints.adminBlogPosts);
    return NextResponse.json(data);
  } catch (error) {
    return toAdminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const token = await getAdminAccessToken();

    if (!token) {
      throw new ApiError("Session expired.", 401);
    }

    const body = await request.json();
    const result = upsertBlogPostSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "validation_error", errors: result.error.flatten() },
        { status: 400 },
      );
    }

    const sanitizedBody = {
      ...result.data,
      contentJson: stringifyBlogContentDocument(
        sanitizeBlogContentDocument(parseBlogContentJson(result.data.contentJson)),
      ),
    };

    const data = await requestAdmin(apiEndpoints.adminBlogPosts, {
      method: "POST",
      json: sanitizedBody,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return toAdminErrorResponse(error);
  }
}
