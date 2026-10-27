# SatQuery Frontend Application (Direct Mode v1.1)

A responsive, dual-mode satellite vision chat interface built with vanilla HTML5, Tailwind CSS, FontAwesome, and `@gradio/client`.

## 🌟 Key Features
- **Interactive Mode**: Single-image visual interrogation with confidence threshold selector (`100% Strict`, `80% Balanced`, `50% Exploratory`), verdict badge, confidence meter, and evidence bounding boxes.
- **Comparison Mode**: Multi-temporal change analysis comparing PAST (5–6 months baseline) and PRESENT captures with 4 real stat cards (Interval Elapsed, Progression Status, Confidence Grade, Change Clusters).
- **Audit & Trust Layer**: Inspect reasons, IoU box audit, and refusal rules (R0–R7) directly from UI tooltips.
- **Direct Gradio Connection**: Automatically connects to the Kaggle worker via `@gradio/client` using the public `gradio.live` URL.
- **Zero-Backend Mock Mode**: Out-of-the-box offline demonstration mode with synthetic high-resolution satellite assets and canned responses.
- **Runtime URL Override**: Settings modal allows updating the live engine URL at runtime without redeploying. Supports `?api=https://xxxx.gradio.live` query parameter as well.

## 🚀 Running Locally
To launch the static interface locally on port 3000:
```bash
# Using Python
python -m http.server 3000 --directory frontend

# Or using Node.js
npx serve frontend -p 3000
```
Then open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Testing the Endpoint Contract
```bash
node frontend/test_api.js
```
