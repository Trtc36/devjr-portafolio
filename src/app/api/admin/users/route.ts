import { NextResponse } from "next/server";
import { toAdminErrorResponse } from "@/features/admin/lib/admin-route";
import { apiEndpoints, requestAdmin } from "@/features/admin/lib/admin-api";
import { createUserSchema } from "@/features/users/lib/user-admin.schema";

export async function GET() {
  try {
    const data = await requestAdmin(apiEndpoints.adminUsers);
    return NextResponse.json(data);
  } catch (error) {
    return toAdminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = createUserSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "validation_error", errors: result.error.flatten() },
        { status: 400 },
      );
    }

    const data = await requestAdmin(apiEndpoints.adminUsers, {
      method: "POST",
      json: result.data,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return toAdminErrorResponse(error);
  }
}
