import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  avatar: z.string().max(100000).refine((value) => {
    if (value === "" || /^\/api\/auth\/profile\/photo\?v=[0-9a-f-]{36}$/.test(value)) return true;
    if (!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) return false;
    const bytes = Buffer.from(value.split(",")[1], "base64");
    return bytes.length <= 75000 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }, "La fotografía debe ser JPEG y ocupar menos de 75 KB"),
}).strict();

export const storedProfileSchema = z.object({ name: z.string().trim().min(2).max(80), avatar: z.string().max(100).regex(/^(?:|\/api\/auth\/profile\/photo\?v=[0-9a-f-]{36})$/) }).strict();
