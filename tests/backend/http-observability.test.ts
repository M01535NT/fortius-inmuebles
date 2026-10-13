import { afterEach, expect, it, vi } from "vitest";
import { apiResponse, ApiError } from "@/lib/backend/http";
afterEach(()=>vi.restoreAllMocks());
it("correlates server failures without logging raw exceptions or customer data",async()=>{
 const log=vi.spyOn(console,"error").mockImplementation(()=>{});
 const response=await apiResponse(async()=>{throw new Error("customer@example.com secret-token");});
 const id=response.headers.get("x-request-id");
 expect(id).toMatch(/^[a-f0-9-]{36}$/);
 expect(await response.json()).toMatchObject({requestId:id,error:"No se pudo completar la operación"});
 expect(log).toHaveBeenCalledOnce();
 expect(JSON.stringify(log.mock.calls)).toContain(id);
 expect(JSON.stringify(log.mock.calls)).not.toMatch(/customer|secret-token/);
});
it("returns independent request IDs on success and keeps expected errors out of server logs",async()=>{
 const log=vi.spyOn(console,"error").mockImplementation(()=>{});
 const a=await apiResponse(async()=>({ok:true}));
 const b=await apiResponse(async()=>{throw new ApiError(409,"El registro cambió");});
 expect(a.headers.get("x-request-id")).toBeTruthy();
 expect(a.headers.get("x-request-id")).not.toBe(b.headers.get("x-request-id"));
 expect(b.status).toBe(409);expect(log).not.toHaveBeenCalled();
});
