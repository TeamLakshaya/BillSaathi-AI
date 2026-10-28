import asyncio,json
from pathlib import Path
from playwright.async_api import async_playwright
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium-headless-shell',args=['--no-sandbox'])
  page=await browser.new_page(viewport={'width':1366,'height':900})
  errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
  uri=Path('bill-saathi/index.html').resolve().as_uri()
  await page.goto(uri+'#cases')
  await page.get_by_label('Search cases',exact=True).fill('BS-1024')
  assert await page.locator('#cases-result tbody tr').count()==1
  await page.get_by_label('Search cases',exact=True).fill('not-a-case')
  assert 'No cases found' in await page.locator('#cases-result').inner_text()
  await page.goto(uri+'#audit')
  await page.get_by_role('button',name='Mark as Reviewed',exact=True).first.click()
  await page.get_by_label('Review note (required)').fill('QA sample note: original times still require confirmation.')
  await page.get_by_role('button',name='Save review',exact=True).click()
  assert 'Resolved by User' in await page.locator('#main').inner_text()
  await page.goto(uri+'#review')
  await page.get_by_role('button',name='Mark as Reviewed',exact=True).click()
  assert 'Reviewed locally' in await page.locator('#main').inner_text()
  await page.goto(uri+'#evidence')
  await page.get_by_role('button',name='Link finding',exact=True).nth(1).click()
  await page.get_by_role('button',name='Save link',exact=True).click()
  assert 'F-01' in await page.locator('#evidence-table tbody tr').nth(1).inner_text()
  await page.goto(uri+'#reports')
  await page.get_by_role('button',name='Review report',exact=True).first.click()
  async with page.expect_download() as dl: await page.get_by_role('button',name='Export .txt',exact=True).click()
  assert (await dl.value).suggested_filename.endswith('.txt')
  await page.get_by_role('button',name='Close',exact=True).click()
  await page.get_by_role('button',name='Use empty workspace',exact=True).click()
  await page.get_by_role('button',name='Switch workspace',exact=True).click()
  assert 'No cases yet' in await page.locator('#main').inner_text()
  await page.goto(uri+'#overview')
  sizes=[]
  for width in [390,768,1440]:
   await page.set_viewport_size({'width':width,'height':900})
   await page.goto(uri+'#overview')
   for r in ['overview','cases','new','upload','review','audit','price','evidence','complaint','affidavit','reports','help','settings','detail']:
    await page.goto(uri+'#'+r)
    b=await page.locator('#main').bounding_box()
    assert b['x']+b['width']<=width+1,(width,r,b)
   sizes.append(width)
  print('Additional checks passed: search/empty results, finding review, OCR sample review, evidence linking, report download, workspace isolation; layout at',sizes,'; JS errors:',errors)
  assert not errors
  await browser.close()
asyncio.run(main())
