# Departments Dashboard — الموقع

صفحة عرض ثابتة (Artifact) مبنية من بيانات ملف `Departments_Dashboard_Linked.xlsx`.
الرابط العام: https://claude.ai/code/artifact/1c0c665a-acb8-4eb5-a806-7a27d1398142

## طريقة التحديث

الموقع **لا يقرأ الإكسل مباشرة ولا يتحدث لحاله** — فيه خطوة توليد يدوية (أو عبر Claude):

1. عدّلي `Departments_Dashboard_Linked.xlsx` بأرقامك اليومية الحقيقية.
2. شغّلي:
   ```
   python3 extract.py /path/to/Departments_Dashboard_Linked.xlsx dashboard_data.json
   python3 render.py dashboard_data.json dashboard.html
   ```
3. انشري `dashboard.html` كـ Artifact على **نفس الرابط** (أو اطلبي من Claude كذا مباشرة
   بإرسال نسخة الإكسل المحدثة وقول "حدّثي الموقع").

- `extract.py` — يقرأ جداول الإكسل (Credit_Decisions, Credit_KPIs, Sales,
  Customer_Care, Collection_Summary, Fixed_Arrears) ويحسب نفس مؤشرات
  Dashboard في الإكسل (آخر يوم/فترة، الاتجاه اليومي) في ملف JSON.
- `template.html` — تصميم الصفحة وكل صيغ الرسم (SVG بدون أي مكتبة خارجية)،
  فيه Placeholder اسمه `__DATA_JSON__`.
- `render.py` — يحقن بيانات JSON داخل `template.html` وينتج `dashboard.html`
  النهائي الجاهز للنشر.
