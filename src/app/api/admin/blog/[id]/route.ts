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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const data = await requestAdmin(apiEndpoints.adminBlogPostById(id));
    return NextResponse.json(data);
  } catch (error) {
    return toAdminErrorResponse(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getAdminAccessToken();

    if (!token) {
      throw new ApiError("Session expired.", 401);
    }

    const { id } = await params;
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

    const data = await requestAdmin(apiEndpoints.adminBlogPostById(id), {
      method: "PUT",
      json: sanitizedBody,
    });

    return NextResponse.json(data);
  } catch (error) {
    return toAdminErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const data = await requestAdmin(apiEndpoints.adminBlogPostById(id), {
      method: "DELETE",
    });

    return NextResponse.json(data);
  } catch (error) {
    return toAdminErrorResponse(error);
  }
}
