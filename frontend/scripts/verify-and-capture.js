import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = '/home/cavalrier/.gemini/antigravity/brain/36033066-a01f-4bbe-85ca-b2c3c17680ab';
const CHROME_PATH = '/home/cavalrier/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome';
const BASE_URL = 'http://localhost:5173';

const VIEWPORTS = [1920, 1440, 1024, 768, 375];

async function run() {
  console.log('Starting verification & screenshot capture with Chromium...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  const results = [];

  for (const width of VIEWPORTS) {
    const height = width === 375 ? 812 : 1080;
    console.log(`\n========================================`);
    console.log(`Testing Viewport: ${width}x${height}`);
    console.log(`========================================`);
    await page.setViewport({ width, height, deviceScaleFactor: 2 });

    // ----------------------------------------------------
    // 1. ABOUT PAGE (y=0)
    // ----------------------------------------------------
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 600));

    // Measure Header at y=0
    const headerMetricsY0 = await page.evaluate(() => {
      const header = document.getElementById('about-header');
      const logo = header?.querySelector('img');
      const text = header?.querySelector('span.font-heading');
      const headerRect = header?.getBoundingClientRect();
      const logoRect = logo?.getBoundingClientRect();
      const textRect = text?.getBoundingClientRect();
      const textStyle = text ? window.getComputedStyle(text) : null;
      const gap = (logoRect && textRect) ? (textRect.left - logoRect.right) : 0;

      return {
        headerHeight: headerRect?.height,
        logoWidth: logoRect?.width,
        logoHeight: logoRect?.height,
        textFontSize: textStyle?.fontSize,
        gap,
        isSingleLine: textRect && logoRect ? Math.abs((textRect.top + textRect.bottom)/2 - (logoRect.top + logoRect.bottom)/2) < 15 : false,
        textWrapped: textRect ? textRect.height > 35 : false
      };
    });

    console.log(`[About y=0 @ ${width}px] Header Height: ${headerMetricsY0.headerHeight}px, Logo: ${headerMetricsY0.logoWidth}x${headerMetricsY0.logoHeight}px, Text Font: ${headerMetricsY0.textFontSize}, Gap: ${headerMetricsY0.gap.toFixed(1)}px, SingleLine: ${headerMetricsY0.isSingleLine}`);

    // Capture About Header y=0
    const headerElem = await page.$('#about-header');
    if (headerElem) {
      await headerElem.screenshot({
        path: path.join(ARTIFACT_DIR, `about_header_y0_${width}.png`)
      });
    }

    // ----------------------------------------------------
    // 2. SCROLL ABOUT PAGE & MEASURE CLS
    // ----------------------------------------------------
    await page.evaluate(() => {
      window.__clsScore = 0;
      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            window.__clsScore += entry.value;
          }
        }
      });
      observer.observe({ type: 'layout-shift', buffered: true });
    });

    // Scroll down 400px to trigger header glass layer
    await page.evaluate(() => window.scrollTo(0, 400));
    await new Promise(r => setTimeout(r, 600));

    // Capture Scrolled Header
    if (headerElem) {
      await headerElem.screenshot({
        path: path.join(ARTIFACT_DIR, `about_header_scrolled_${width}.png`)
      });
    }

    // Scroll all the way to bottom and back
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 600));
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 400));

    const cls = await page.evaluate(() => window.__clsScore || 0);
    console.log(`[About Scroll @ ${width}px] Cumulative Layout Shift (CLS): ${cls.toFixed(4)}`);

    // ----------------------------------------------------
    // 3. ABOUT FOOTER
    // ----------------------------------------------------
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise(r => setTimeout(r, 800));

    const footerMetrics = await page.evaluate(() => {
      const footer = document.querySelector('footer');
      const logo = footer?.querySelector('img');
      const text = footer?.querySelector('span.font-heading');
      const logoRect = logo?.getBoundingClientRect();
      const textRect = text?.getBoundingClientRect();
      const gap = (logoRect && textRect) ? (textRect.left - logoRect.right) : 0;
      return {
        logoWidth: logoRect?.width,
        logoHeight: logoRect?.height,
        gap
      };
    });

    console.log(`[About Footer @ ${width}px] Logo: ${footerMetrics.logoWidth}x${footerMetrics.logoHeight}px, Gap: ${footerMetrics.gap.toFixed(1)}px`);

    const footerElem = await page.$('footer');
    if (footerElem) {
      await footerElem.screenshot({
        path: path.join(ARTIFACT_DIR, `about_footer_${width}.png`)
      });
    }

    // ----------------------------------------------------
    // 4. CHAT TOP BAR
    // ----------------------------------------------------
    await page.goto(`${BASE_URL}/projects`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 600));

    const chatMetrics = await page.evaluate(() => {
      const header = document.querySelector('header');
      const logo = header?.querySelector('img');
      const text = header?.querySelector('span.font-heading');
      const headerRect = header?.getBoundingClientRect();
      const logoRect = logo?.getBoundingClientRect();
      const textRect = text && window.getComputedStyle(text).display !== 'none' ? text.getBoundingClientRect() : null;
      const gap = (logoRect && textRect) ? (textRect.left - logoRect.right) : 14;
      return {
        headerHeight: headerRect?.height,
        logoWidth: logoRect?.width,
        logoHeight: logoRect?.height,
        gap
      };
    });

    console.log(`[Chat Top Bar @ ${width}px] Header Height: ${chatMetrics.headerHeight}px, Logo: ${chatMetrics.logoWidth}x${chatMetrics.logoHeight}px, Gap: ${chatMetrics.gap.toFixed(1)}px`);

    const chatHeaderElem = await page.$('header');
    if (chatHeaderElem) {
      await chatHeaderElem.screenshot({
        path: path.join(ARTIFACT_DIR, `chat_topbar_${width}.png`)
      });
    }

    // ----------------------------------------------------
    // 5. APP SIDEBAR (Open & Collapsed Rail)
    // ----------------------------------------------------
    if (width >= 768) {
      // First ensure sidebar is expanded (open)
      const isCurrentlyCollapsed = await page.evaluate(() => {
        const aside = document.querySelector('aside');
        return aside?.classList.contains('w-16');
      });

      if (isCurrentlyCollapsed) {
        const expandBtn = await page.$('aside button[title*="Expand sidebar"]');
        if (expandBtn) {
          await expandBtn.click();
          await new Promise(r => setTimeout(r, 400));
        }
      }

      // Check open sidebar metrics
      const sidebarOpenMetrics = await page.evaluate(() => {
        const sidebar = document.querySelector('aside');
        const logo = sidebar?.querySelector('img');
        const text = sidebar?.querySelector('span.font-heading');
        const topSection = sidebar?.querySelector('.pt-5');
        const logoRect = logo?.getBoundingClientRect();
        const textRect = text?.getBoundingClientRect();
        const topStyle = topSection ? window.getComputedStyle(topSection) : null;
        const gap = (logoRect && textRect) ? (textRect.left - logoRect.right) : 0;

        return {
          logoWidth: logoRect?.width,
          logoHeight: logoRect?.height,
          paddingTop: topStyle?.paddingTop,
          gap
        };
      });

      console.log(`[Sidebar Open @ ${width}px] Logo: ${sidebarOpenMetrics.logoWidth}x${sidebarOpenMetrics.logoHeight}px, PaddingTop: ${sidebarOpenMetrics.paddingTop}, Gap: ${sidebarOpenMetrics.gap.toFixed(1)}px`);

      const asideElem = await page.$('aside');
      if (asideElem) {
        await asideElem.screenshot({
          path: path.join(ARTIFACT_DIR, `sidebar_open_${width}.png`)
        });
      }

      // Collapse to test 64px rail
      const collapseBtn = await page.$('aside button[title*="Collapse sidebar"]');
      if (collapseBtn) {
        await collapseBtn.click();
        await new Promise(r => setTimeout(r, 400));

        const railMetrics = await page.evaluate(() => {
          const sidebar = document.querySelector('aside');
          const logo = sidebar?.querySelector('img');
          const sidebarRect = sidebar?.getBoundingClientRect();
          const logoRect = logo?.getBoundingClientRect();
          const leftMargin = logoRect && sidebarRect ? logoRect.left - sidebarRect.left : 0;
          const rightMargin = logoRect && sidebarRect ? sidebarRect.right - logoRect.right : 0;

          return {
            sidebarWidth: sidebarRect?.width,
            logoWidth: logoRect?.width,
            logoHeight: logoRect?.height,
            isCentered: Math.abs(leftMargin - rightMargin) < 1,
            leftMargin,
            rightMargin
          };
        });

        console.log(`[Sidebar Rail @ ${width}px] Rail Width: ${railMetrics.sidebarWidth}px, Logo: ${railMetrics.logoWidth}x${railMetrics.logoHeight}px, Centered: ${railMetrics.isCentered} (L: ${railMetrics.leftMargin.toFixed(1)}px, R: ${railMetrics.rightMargin.toFixed(1)}px)`);

        if (asideElem) {
          await asideElem.screenshot({
            path: path.join(ARTIFACT_DIR, `sidebar_rail_${width}.png`)
          });
        }
      }
    } else {
      // Mobile view (375px): open mobile drawer to verify
      const menuBtn = await page.$('button[aria-label="Open sidebar"]');
      if (menuBtn) {
        await menuBtn.click();
        await new Promise(r => setTimeout(r, 400));

        const mobileMetrics = await page.evaluate(() => {
          const sidebar = document.querySelector('aside');
          const logo = sidebar?.querySelector('img');
          const logoRect = logo?.getBoundingClientRect();
          return {
            logoWidth: logoRect?.width,
            logoHeight: logoRect?.height
          };
        });

        console.log(`[Sidebar Mobile Drawer @ ${width}px] Logo: ${mobileMetrics.logoWidth}x${mobileMetrics.logoHeight}px`);

        const asideElem = await page.$('aside');
        if (asideElem) {
          await asideElem.screenshot({
            path: path.join(ARTIFACT_DIR, `sidebar_open_${width}.png`)
          });
        }
      }
    }
  }

  await browser.close();
  console.log('\nAll verifications & screenshots completed successfully!');
}

run().catch(err => {
  console.error('Error during verification:', err);
  process.exit(1);
});
