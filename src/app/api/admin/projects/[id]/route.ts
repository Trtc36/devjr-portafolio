import { NextResponse } from "next/server";
import { toAdminErrorResponse } from "@/features/admin/lib/admin-route";
import { apiEndpoints, requestAdmin } from "@/features/admin/lib/admin-api";
import { upsertProjectSchema } from "@/features/projects/lib/project-admin.schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const data = await requestAdmin(apiEndpoints.adminProjectById(id));
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
    const { id } = await params;
    const body = await request.json();
    const result = upsertProjectSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "validation_error", errors: result.error.flatten() },
        { status: 400 },
      );
    }

    const data = await requestAdmin(apiEndpoints.adminProjectById(id), {
      method: "PUT",
      json: result.data,
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
    const data = await requestAdmin(apiEndpoints.adminProjectById(id), {
      method: "DELETE",
    });

    return NextResponse.json(data);
  } catch (error) {
    return toAdminErrorResponse(error);
  }
}
