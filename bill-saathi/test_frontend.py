import asyncio,json
from pathlib import Path
from playwright.async_api import async_playwright
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium-headless-shell',args=['--no-sandbox'])
  page=await browser.new_page(viewport={'width':1440,'height':1100})
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  await page.goto(Path('bill-saathi/index.html').resolve().as_uri())
  await page.screenshot(path='bill-saathi/dashboard-desktop.png',full_page=True)
  results=[]
  for r in ['cases','new','upload','review','audit','price','evidence','complaint','affidavit','reports','help','settings','detail','overview']:
   await page.goto(Path('bill-saathi/index.html').resolve().as_uri()+'#'+r)
   await page.locator('#main').wait_for()
   results.append({'route':r,'hasContent':len(await page.locator('#main').inner_text())>100})
  await page.get_by_role('button',name='Start New Bill Review').click()
  await page.get_by_label('Case name',exact=False).fill('QA sample review')
  await page.get_by_label('Hospital or healthcare provider',exact=False).fill('QA Fictional Hospital')
  await page.get_by_label('Total bill amount',exact=False).fill('1000')
  await page.get_by_role('button',name='Continue',exact=True).click()
  await page.get_by_label('Understand my hospital bill.',exact=True).check()
  await page.get_by_role('button',name='Continue',exact=True).click()
  await page.get_by_role('button',name='Create case locally',exact=True).click()
  assert 'QA sample review' in await page.locator('#main').inner_text()
  results.append({'caseWizard':'passed'})
  await page.goto(Path('bill-saathi/index.html').resolve().as_uri()+'#upload')
  await page.locator('#file-input').set_input_files({'name':'test.txt','mimeType':'text/plain','buffer':b'unsupported'})
  assert 'Unsupported file type' in await page.locator('#pending-files').inner_text()
  await page.locator('#file-input').set_input_files({'name':'sample.pdf','mimeType':'application/pdf','buffer':b'%PDF-1.4\n%%EOF'})
  await page.get_by_role('button',name='Add selected files locally',exact=True).click()
  assert 'Selected locally' in await page.locator('#main').inner_text()
  results.append({'fileValidationAndLocalSelection':'passed'})
  await page.goto(Path('bill-saathi/index.html').resolve().as_uri()+'#complaint')
  await page.get_by_role('button',name='Continue',exact=True).click()
  await page.get_by_role('button',name='Prepare local template',exact=True).click()
  assert await page.locator('#draft-editor').input_value()
  await page.get_by_role('button',name='Continue',exact=True).click()
  for check in await page.locator('.final-check').all(): await check.check()
  async with page.expect_download() as dl:
   await page.get_by_role('button',name='Export draft (.txt)',exact=True).click()
  assert (await dl.value).suggested_filename.endswith('.txt')
  results.append({'draftWizardAndExport':'passed'})
  await page.set_viewport_size({'width':390,'height':844})
  await page.goto(Path('bill-saathi/index.html').resolve().as_uri()+'#overview')
  await page.screenshot(path='bill-saathi/dashboard-mobile.png',full_page=True)
  # local QA can inspect the rendered dimensions
  overflow=await page.locator('body').bounding_box()
  assert overflow['width']<=390
  await page.get_by_role('button',name='Open navigation',exact=True).click()
  assert 'mobile-open' in (await page.locator('body').get_attribute('class') or '')
  results.append({'mobileDrawer':'passed'})
  await page.get_by_role('button',name='Settings',exact=True).click()
  assert 'Settings & privacy' in await page.locator('#main').inner_text()
  await browser.close()
  Path('bill-saathi/qa-results.json').write_text(json.dumps({'checks':results,'browserErrors':errors},indent=2))
  print(json.dumps({'checks':results,'browserErrors':errors},indent=2))
  assert not errors
asyncio.run(main())
