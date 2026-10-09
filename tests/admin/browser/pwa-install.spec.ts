import {test,expect} from '@playwright/test';
test('iPhone install metadata and manifest icons',async({page,request})=>{
 await page.goto('/avisos');
 await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute('content','yes');
 await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute('content','Fortius');
 const apple=await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
 expect(apple).toBeTruthy();expect((await request.get(apple!)).status()).toBe(200);
 const href=await page.locator('link[rel="manifest"]').getAttribute('href');
 const response=await request.get(href!);expect(response.status()).toBe(200);
 const manifest=await response.json();expect(manifest.display).toBe('standalone');expect(manifest.start_url).toBe('/');expect(manifest.scope).toBe('/');
 for(const icon of manifest.icons){const r=await request.get(icon.src);expect(r.status()).toBe(200);expect(r.headers()['content-type']).toContain('image/png');}
});
