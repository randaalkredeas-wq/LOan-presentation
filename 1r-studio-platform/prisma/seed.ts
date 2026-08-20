// 1R. Studio — demo data seed.
// Catalog (services/packages/inclusions/add-ons) is REAL data transcribed from the
// studio's own package sheets — nothing here is invented. Customers/orders/expenses
// below are clearly-labelled DEMO data for development & showcasing the platform.
import { PrismaClient, OrderStatus, PaymentStatus, ExpenseType, BlockedDateType } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// ── Helpers ────────────────────────────────────────────────────────────
function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function weightedPick<T>(pool: { item: T; weight: number }[]): T {
  const total = pool.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const p of pool) {
    if (r < p.weight) return p.item;
    r -= p.weight;
  }
  return pool[0].item;
}
function pad(n: number, len = 2) {
  return String(n).padStart(len, "0");
}
function toDateOnly(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m, d));
}

async function main() {
  console.log("Seeding 1R. Studio platform…");

  // ── Owner account ───────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Studio@2026", 10);
  await db.user.upsert({
    where: { email: "owner@1rstudio.sa" },
    update: {},
    create: { name: "1R. Studio", email: "owner@1rstudio.sa", passwordHash, role: "OWNER" },
  });

  // ── Settings ─────────────────────────────────────────────────────────
  await db.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      businessNameEn: "1R. Studio",
      businessNameAr: "استوديو ون آر",
      currency: "SAR",
      workingDays: [0, 1, 2, 3, 4, 6], // Sat–Thu; Friday off
      slotDurationMinutes: 240,
      fixedCostsMonthly: 900, // recurring baseline operating (rent/internet/software/etc.)
    },
  });

  // ── Time slots ───────────────────────────────────────────────────────
  const slotLabels = ["09:00", "13:00", "17:00"];
  for (let i = 0; i < slotLabels.length; i++) {
    await db.timeSlot.upsert({
      where: { label: slotLabels[i] },
      update: {},
      create: { label: slotLabels[i], sortOrder: i, isActive: true },
    });
  }

  // ── Expense categories ───────────────────────────────────────────────
  const directCats = [
    { key: "album_printing", nameEn: "Album Printing", nameAr: "طباعة الألبومات" },
    { key: "photo_printing", nameEn: "Photo Printing", nameAr: "طباعة الصور" },
    { key: "frames", nameEn: "Frames", nameAr: "البراويز" },
    { key: "packaging", nameEn: "Packaging", nameAr: "التغليف" },
    { key: "freelancers", nameEn: "Editing Freelancers", nameAr: "محررون مستقلون" },
    { key: "transport", nameEn: "Transportation", nameAr: "المواصلات" },
    { key: "props", nameEn: "Props", nameAr: "الإكسسوارات والدعائم" },
    { key: "event_specific", nameEn: "Event-specific Costs", nameAr: "تكاليف خاصة بالجلسة" },
  ];
  const operatingCats = [
    { key: "rent", nameEn: "Studio Rent", nameAr: "إيجار الاستديو" },
    { key: "electricity", nameEn: "Electricity", nameAr: "الكهرباء" },
    { key: "internet", nameEn: "Internet", nameAr: "الإنترنت" },
    { key: "software", nameEn: "Software Subscriptions", nameAr: "اشتراكات البرامج" },
    { key: "adobe", nameEn: "Editing Software (Adobe)", nameAr: "برامج التحرير (أدوبي)" },
    { key: "hosting", nameEn: "Website Hosting", nameAr: "استضافة الموقع" },
    { key: "marketing", nameEn: "Marketing", nameAr: "التسويق" },
    { key: "advertising", nameEn: "Advertising", nameAr: "الإعلانات" },
    { key: "salaries", nameEn: "Salaries", nameAr: "الرواتب" },
    { key: "maintenance", nameEn: "Equipment Maintenance", nameAr: "صيانة المعدات" },
    { key: "insurance", nameEn: "Insurance", nameAr: "التأمين" },
    { key: "phone", nameEn: "Phone", nameAr: "الهاتف" },
    { key: "other", nameEn: "Other Expenses", nameAr: "مصروفات أخرى" },
  ];
  const catIds: Record<string, string> = {};
  for (const c of directCats) {
    const row = await db.expenseCategory.create({ data: { nameEn: c.nameEn, nameAr: c.nameAr, type: ExpenseType.DIRECT } });
    catIds[c.key] = row.id;
  }
  for (const c of operatingCats) {
    const row = await db.expenseCategory.create({ data: { nameEn: c.nameEn, nameAr: c.nameAr, type: ExpenseType.OPERATING } });
    catIds[c.key] = row.id;
  }

  // ── Services & Packages (REAL — source: 1R. Studio package sheets) ───
  const newborn = await db.service.create({
    data: {
      slug: "newborn-hospital",
      nameEn: "Newborn & Hospital Photography",
      nameAr: "تصوير المواليد والمستشفى",
      descriptionEn:
        "We believe every moment in a newborn's first days holds priceless value. Our hospital sessions use professional cameras and gear to capture the small, tender details of new beginnings — with a calm, safe environment and the highest standards of cleanliness and privacy.",
      descriptionAr:
        "نؤمن أن كل لحظة في الأيام الأولى من حياة الطفل تحمل قيمة لا تُقدّر بثمن، ولهذا نحرص على تقديم تجربة تصوير بمعدات وكاميرات احترافية تركز على التفاصيل الصغيرة والبريئة. نلتزم بتوفير بيئة آمنة وهادئة تناسب حساسية المولود، ونراعي أعلى معايير النظافة والخصوصية.",
      sortOrder: 1,
    },
  });
  const maternity = await db.service.create({
    data: {
      slug: "maternity",
      nameEn: "Maternity Photography",
      nameAr: "تصوير الحمل",
      descriptionEn:
        "For every mother carrying life within her, living the most beautiful journey — this is not just a wait, it's the beginning of a lifelong love story.",
      descriptionAr: "لمن تحتضن الحياة في داخلها وتعيش أجمل رحلة منحها الله للأنثى — هذه اللحظة ليست مجرد انتظار بل بداية قصة حب أبدية.",
      sortOrder: 2,
    },
  });
  const family = await db.service.create({
    data: {
      slug: "family",
      nameEn: "Family Photography",
      nameAr: "تصوير عائلي",
      descriptionEn: "A full family session capturing mother, father, siblings and the newest addition together.",
      descriptionAr: "جلسة تصوير عائلية كاملة تجمع الأم والأب والإخوة والمولود الجديد في لحظة واحدة.",
      sortOrder: 3,
    },
  });
  const themed = await db.service.create({
    data: {
      slug: "themed",
      nameEn: "Themed Photography",
      nameAr: "تصوير بالثيمات",
      descriptionEn: "Two distinct themes and outfit changes in one creative session.",
      descriptionAr: "تصوير احترافي بثيمين مختلفين وتغيير الإطلالة لكل ثيم في جلسة إبداعية واحدة.",
      sortOrder: 4,
    },
  });
  const lifestyle = await db.service.create({
    data: {
      slug: "lifestyle",
      nameEn: "Lifestyle Photography",
      nameAr: "تصوير لايف ستايل",
      descriptionEn: "Natural, candid family moments captured in an authentic lifestyle style.",
      descriptionAr: "لحظات عائلية طبيعية وعفوية موثّقة بأسلوب لايف ستايل أصيل.",
      sortOrder: 5,
    },
  });

  type InclusionInput = { en: string; ar: string };
  type AddonInput = { nameEn: string; nameAr: string; price: number };

  async function createPackage(opts: {
    serviceId: string; slug: string; nameEn: string; nameAr: string;
    descriptionEn: string; descriptionAr: string;
    price: number; deposit: number; duration: number; directCost: number;
    badgeEn?: string; badgeAr?: string; sortOrder: number;
    inclusions: InclusionInput[]; addons: AddonInput[];
  }) {
    const pkg = await db.package.create({
      data: {
        serviceId: opts.serviceId, slug: opts.slug, nameEn: opts.nameEn, nameAr: opts.nameAr,
        descriptionEn: opts.descriptionEn, descriptionAr: opts.descriptionAr,
        price: opts.price, depositAmount: opts.deposit, durationMinutes: opts.duration,
        directCost: opts.directCost, badgeEn: opts.badgeEn, badgeAr: opts.badgeAr, sortOrder: opts.sortOrder,
        inclusions: { create: opts.inclusions.map((i, idx) => ({ textEn: i.en, textAr: i.ar, sortOrder: idx })) },
        addons: { create: opts.addons.map((a) => ({ nameEn: a.nameEn, nameAr: a.nameAr, price: a.price })) },
      },
    });
    return pkg;
  }

  const packages = [];

  packages.push(await createPackage({
    serviceId: newborn.id, slug: "newborn-economic-2", nameEn: "Economic Package", nameAr: "الباقة الاقتصادية",
    descriptionEn: "An accessible newborn session with professional retouching and a mobile-shot keepsake video.",
    descriptionAr: "جلسة تصوير مواليد بسعر مناسب مع تعديل احترافي وفيديو تذكاري بالجوال.",
    price: 575, deposit: 300, duration: 60, directCost: 160, sortOrder: 1,
    inclusions: [
      { en: "Professional 1-hour newborn photography with camera & pro equipment — unlimited shots", ar: "تصوير احترافي للمولود لمدة ساعة بكاميرا ومعدات احترافية - عدد مفتوح من الصور" },
      { en: "Choice of 10 photos for professional Photoshop retouching", ar: "اختيار 10 صور للتعديل الاحترافي بالفوتوشوب" },
      { en: "Mobile-shot video + edit of the newborn (1–1.5 min after editing)", ar: "تصوير فيديو ومونتاج للمولود بالجوال (من دقيقة إلى دقيقة ونصف بعد المونتاج)" },
      { en: "All photos delivered via WhatsApp as a file", ar: "إرسال جميع الصور عبر الواتساب بصيغة ملف" },
    ],
    addons: [
      { nameEn: "Photo album (21×15, 20 photos)", nameAr: "ألبوم صور (21×15، 20 صورة)", price: 385 },
      { nameEn: "USB flash — all photos & videos", nameAr: "فلاش ميموري - جميع الصور والفيديوهات", price: 45 },
      { nameEn: "Frame A5", nameAr: "برواز مقاس A5", price: 45 },
      { nameEn: "Frame A4", nameAr: "برواز مقاس A4", price: 55 },
      { nameEn: "Additional person in video", nameAr: "إضافة شخص للفيديو", price: 70 },
    ],
  }));

  packages.push(await createPackage({
    serviceId: newborn.id, slug: "newborn-bronze", nameEn: "Bronze Package", nameAr: "الباقة البرونزية",
    descriptionEn: "Newborn session plus a 20-minute hospital arrival/reception shoot and printed keepsakes.",
    descriptionAr: "جلسة تصوير للمولود مع تصوير الاستقبال في المستشفى لمدة 20 دقيقة وطباعة صور تذكارية.",
    price: 885, deposit: 300, duration: 80, directCost: 260, sortOrder: 2,
    inclusions: [
      { en: "Professional 1-hour newborn photography — unlimited shots", ar: "تصوير احترافي للمولود لمدة ساعة - عدد مفتوح من الصور" },
      { en: "Choice of 15 photos for Photoshop retouching", ar: "اختيار 15 صورة للتعديل بالفوتوشوب" },
      { en: "Printing of 5 retouched photos (A5) + matching frame, home delivery", ar: "طباعة 5 صور معدلة مقاس A5 + برواز بنفس المقاس، مع الاستلام من المنزل" },
      { en: "Mobile video + edit of newborn with mom & dad (1–1.5 min)", ar: "فيديو ومونتاج للمولود مع الأم والأب (من دقيقة إلى دقيقة ونصف)" },
      { en: "Hospital reception photography — 20 minutes, unlimited shots, 15 retouched", ar: "تصوير الاستقبال لمدة 20 دقيقة، عدد مفتوح من الصور، تعديل 15 صورة" },
      { en: "All photos & video sent via WhatsApp file", ar: "إرسال جميع الصور والفيديو عبر الواتساب بصيغة ملف" },
      { en: "USB flash with all photos & videos, home delivery", ar: "فلاش ميموري بجميع الصور والفيديوهات مع الاستلام من المنزل" },
    ],
    addons: [
      { nameEn: "Photo album (21×15, 20 photos)", nameAr: "ألبوم صور (21×15، 20 صورة)", price: 385 },
      { nameEn: "Additional person in video", nameAr: "إضافة شخص للفيديو", price: 70 },
    ],
  }));

  packages.push(await createPackage({
    serviceId: newborn.id, slug: "newborn-gold", nameEn: "Gold Package", nameAr: "الباقة الذهبية",
    descriptionEn: "An extended family newborn session with a 30-minute reception shoot — album included.",
    descriptionAr: "جلسة تصوير عائلية موسّعة للمولود مع تصوير استقبال لمدة 30 دقيقة — يشمل ألبوم صور.",
    price: 1050, deposit: 300, duration: 120, directCost: 340,
    badgeEn: "Most Popular", badgeAr: "الأكثر طلبًا", sortOrder: 3,
    inclusions: [
      { en: "Professional 1.5-hour newborn photography with mom, dad & siblings — unlimited shots", ar: "تصوير احترافي للمولود لمدة ساعة ونصف مع الأم والأب والإخوة - عدد مفتوح من الصور" },
      { en: "Choice of 20 photos for Photoshop retouching", ar: "اختيار 20 صورة للتعديل بالفوتوشوب" },
      { en: "Printing 10 photos (A5) + A4 frame with photo, mother's choice", ar: "طباعة 10 صور مقاس A5 + برواز A4 مع صورة، من اختيار الأم" },
      { en: "Mobile video + edit with mom, dad & siblings (1–2 min)", ar: "فيديو ومونتاج مع الأم والأب والإخوة (من دقيقة إلى دقيقتين)" },
      { en: "Hospital reception photography — 30 minutes, unlimited shots, 20 retouched", ar: "تصوير الاستقبال لمدة 30 دقيقة، عدد مفتوح من الصور، تعديل 20 صورة" },
      { en: "All videos & edited photos sent via WhatsApp file", ar: "إرسال جميع الفيديوهات والصور المعدلة عبر الواتساب بصيغة ملف" },
      { en: "Professional mobile video + edit for reception & hospitality", ar: "فيديو ومونتاج احترافي بالجوال للاستقبال والضيافة" },
      { en: "USB flash with all reception & newborn photos/videos", ar: "فلاش ميموري يحتوي على جميع صور وفيديوهات الاستقبال والمولود" },
      { en: "Photo album (21×15, 20 photos), mother's choice — included, home delivery", ar: "ألبوم صور (21×15، 20 صورة) من اختيار الأم — شامل ضمن الباقة، مع الاستلام من المنزل" },
    ],
    addons: [],
  }));

  packages.push(await createPackage({
    serviceId: newborn.id, slug: "newborn-diamond", nameEn: "Diamond Package", nameAr: "الباقة الألماسية",
    descriptionEn: "The complete newborn experience — 45-minute reception coverage and a large keepsake album.",
    descriptionAr: "التجربة الكاملة لتصوير المولود — تغطية استقبال لمدة 45 دقيقة وألبوم تذكاري كبير.",
    price: 1500, deposit: 350, duration: 135, directCost: 520,
    badgeEn: "Premium", badgeAr: "مميزة", sortOrder: 4,
    inclusions: [
      { en: "Professional 1.5-hour newborn photography with mom, dad & siblings — unlimited shots", ar: "تصوير احترافي للمولود لمدة ساعة ونصف مع الأم والأب والإخوة - عدد مفتوح من الصور" },
      { en: "Choice of 30 photos for Photoshop retouching", ar: "اختيار 30 صورة للتعديل بالفوتوشوب" },
      { en: "Large album (25×25, 20 photos), mother's choice — included", ar: "طباعة ألبوم كبير مقاس 25×25 (20 صورة) من اختيار الأم — شامل" },
      { en: "Printing 15 photos (A5), mother's choice", ar: "طباعة 15 صورة مقاس A5 من اختيار الأم" },
      { en: "2 photos printed on frames (A5 & A4), mother's choice", ar: "طباعة صورتين على برواز مقاس A5 و A4 من اختيار الأم" },
      { en: "Mobile video + edit with mom, dad & siblings (1–1.5 min)", ar: "فيديو ومونتاج مع الأم والأب والإخوة (من دقيقة إلى دقيقة ونصف)" },
      { en: "Hospital reception photography — 45 minutes, unlimited shots, 30 retouched", ar: "تصوير الاستقبال لمدة 45 دقيقة، عدد مفتوح من الصور، تعديل 30 صورة" },
      { en: "Professional video + edit for reception & hospitality", ar: "فيديو ومونتاج احترافي للاستقبال والضيافة" },
      { en: "USB flash with all reception & newborn photos/videos, home delivery", ar: "فلاش ميموري بجميع صور وفيديوهات الاستقبال والمولود، مع الاستلام من المنزل" },
    ],
    addons: [],
  }));

  packages.push(await createPackage({
    serviceId: maternity.id, slug: "maternity-1", nameEn: "Maternity Session 1", nameAr: "جلسة تصوير الحمل 1",
    descriptionEn: "A 40-minute maternity session with professional retouching and printed keepsakes.",
    descriptionAr: "جلسة تصوير حمل لمدة 40 دقيقة مع تعديل احترافي وطباعة صور تذكارية.",
    price: 550, deposit: 300, duration: 40, directCost: 150, sortOrder: 1,
    inclusions: [
      { en: "Professional 40-minute photography with camera & pro equipment — unlimited shots", ar: "تصوير احترافي لمدة 40 دقيقة بكاميرا ومعدات احترافية - عدد مفتوح من الصور" },
      { en: "Choice of 5 photos for Photoshop retouching", ar: "اختيار 5 صور للتعديل بالفوتوشوب" },
      { en: "Printing 3 photos (A5), mother's choice, home delivery", ar: "طباعة 3 صور مقاس A5 من اختيار الأم، مع الاستلام من المنزل" },
      { en: "Mom & dad only (additional person +70 SAR)", ar: "التصوير للأم والأب فقط (إضافة شخص +70 ريال)" },
      { en: "All photos sent via WhatsApp file", ar: "إرسال جميع الصور عبر الواتساب بصيغة ملف" },
    ],
    addons: [
      { nameEn: "USB flash — all photos", nameAr: "فلاش ميموري - جميع الصور", price: 45 },
      { nameEn: "Photo album", nameAr: "ألبوم صور", price: 385 },
      { nameEn: "Frame A5", nameAr: "برواز مقاس A5", price: 45 },
      { nameEn: "Frame A4", nameAr: "برواز مقاس A4", price: 55 },
      { nameEn: "Mobile video shoot + edit", nameAr: "تصوير فيديو بالجوال ومونتاج", price: 80 },
      { nameEn: "Additional person", nameAr: "إضافة شخص للتصوير", price: 70 },
    ],
  }));

  packages.push(await createPackage({
    serviceId: maternity.id, slug: "maternity-2", nameEn: "Maternity Session 2", nameAr: "جلسة تصوير الحمل 2",
    descriptionEn: "A full 1-hour maternity session with more retouching and printed keepsakes.",
    descriptionAr: "جلسة تصوير حمل كاملة لمدة ساعة مع مزيد من الصور المعدّلة والمطبوعة.",
    price: 650, deposit: 300, duration: 60, directCost: 170, sortOrder: 2,
    inclusions: [
      { en: "Professional 1-hour photography — unlimited shots", ar: "تصوير احترافي لمدة ساعة - عدد مفتوح من الصور" },
      { en: "Choice of 10 photos for Photoshop retouching", ar: "اختيار 10 صور للتعديل بالفوتوشوب" },
      { en: "Printing 6 photos (A5), mother's choice, home delivery", ar: "طباعة 6 صور مقاس A5 من اختيار الأم، مع الاستلام من المنزل" },
      { en: "Mom & dad only (additional person +70 SAR)", ar: "التصوير للأم والأب فقط (إضافة شخص +70 ريال)" },
      { en: "All photos sent via WhatsApp file", ar: "إرسال جميع الصور عبر الواتساب بصيغة ملف" },
    ],
    addons: [
      { nameEn: "USB flash — all photos", nameAr: "فلاش ميموري - جميع الصور", price: 45 },
      { nameEn: "Photo album", nameAr: "ألبوم صور", price: 385 },
      { nameEn: "Frame A5", nameAr: "برواز مقاس A5", price: 45 },
      { nameEn: "Frame A4", nameAr: "برواز مقاس A4", price: 55 },
      { nameEn: "Mobile video shoot + edit", nameAr: "تصوير فيديو بالجوال ومونتاج", price: 80 },
      { nameEn: "Additional person", nameAr: "إضافة شخص للتصوير", price: 70 },
    ],
  }));

  packages.push(await createPackage({
    serviceId: family.id, slug: "family-session", nameEn: "Family Session", nameAr: "جلسة تصوير عائلي",
    descriptionEn: "A 1-hour session with mom, dad, siblings and the newborn together.",
    descriptionAr: "جلسة تصوير لمدة ساعة تجمع الأم والأب والإخوة والمولود.",
    price: 750, deposit: 300, duration: 60, directCost: 180, sortOrder: 1,
    inclusions: [
      { en: "Professional 1-hour photography — unlimited shots", ar: "تصوير احترافي لمدة ساعة - عدد مفتوح من الصور" },
      { en: "Mom, dad, siblings & the newborn together", ar: "التصوير للأم والأب والإخوة والمولود" },
      { en: "Editing of 6 photos, mother's choice", ar: "تعديل 6 صور من اختيار الأم" },
      { en: "USB flash with all session photos — included", ar: "فلاش ميموري يحتوي على جميع صور الجلسة — شامل ضمن الباقة" },
      { en: "Printing 6 photos (A5) + 1 photo (A4), mother's choice, sent via WhatsApp file", ar: "طباعة 6 صور مقاس A5 وصورة مقاس A4 من اختيار الأم، إرسال عبر الواتساب بصيغة ملف" },
    ],
    addons: [],
  }));

  packages.push(await createPackage({
    serviceId: themed.id, slug: "themed-session", nameEn: "Themed Session", nameAr: "جلسة تصوير بالثيمات",
    descriptionEn: "Two distinct themes with an outfit change for each, one hour per theme.",
    descriptionAr: "ثيمان مختلفان مع تغيير الإطلالة لكل ثيم، بمعدل ساعة لكل ثيم.",
    price: 800, deposit: 300, duration: 120, directCost: 220, sortOrder: 1,
    inclusions: [
      { en: "Professional photography with 2 different themes, 1 hour per theme — unlimited shots", ar: "تصوير احترافي بثيمين مختلفين، ساعة لكل ثيم - عدد مفتوح من الصور" },
      { en: "Mom, dad & child (twin photography +300 SAR)", ar: "التصوير للأم والأب والطفل (تصوير التوأم +300 ريال)" },
      { en: "Editing of 8 photos, mother's choice", ar: "تعديل 8 صور من اختيار الأم" },
      { en: "USB flash with all session photos — included", ar: "فلاش ميموري يحتوي على جميع صور الجلسة — شامل ضمن الباقة" },
      { en: "Printing 5 photos (A5) + 3 photos (A4) + wooden frames A5 & A4 — included", ar: "طباعة 5 صور مقاس A5 و3 صور مقاس A4 + برواز خشبي A5 و A4 — شامل ضمن الباقة" },
    ],
    addons: [
      { nameEn: "Wooden foam board A5", nameAr: "لوحة خشبية فووم مقاس A5", price: 95 },
      { nameEn: "Wooden foam board A4", nameAr: "لوحة خشبية فووم مقاس A4", price: 120 },
      { nameEn: "Mini album (15×21, 5 pages / 10 sides)", nameAr: "ألبوم مصغر (15×21، 5 صفحات / 10 أوجه)", price: 350 },
      { nameEn: "Twin photography", nameAr: "تصوير التوأم", price: 300 },
    ],
  }));

  packages.push(await createPackage({
    serviceId: lifestyle.id, slug: "lifestyle-session", nameEn: "Lifestyle Session", nameAr: "جلسة لايف ستايل",
    descriptionEn: "A relaxed, candid 1-hour lifestyle session for mom, dad & child.",
    descriptionAr: "جلسة لايف ستايل هادئة وعفوية لمدة ساعة للأم والأب والطفل.",
    price: 750, deposit: 300, duration: 60, directCost: 175, sortOrder: 1,
    inclusions: [
      { en: "Professional 1-hour photography — unlimited shots", ar: "تصوير احترافي لمدة ساعة - عدد مفتوح من الصور" },
      { en: "Mom, dad & child; editing of 6 photos, mother's choice", ar: "التصوير للأم والأب والطفل، تعديل 6 صور من اختيار الأم" },
      { en: "USB flash with all session photos — included", ar: "فلاش ميموري يحتوي على جميع صور الجلسة — شامل ضمن الباقة" },
      { en: "Printing 6 photos (A5) + 1 photo (A4), sent via WhatsApp file", ar: "طباعة 6 صور مقاس A5 وصورة مقاس A4، إرسال عبر الواتساب بصيغة ملف" },
    ],
    addons: [],
  }));

  console.log(`Seeded ${packages.length} real packages across 5 services.`);

  // ── KRI Definitions ──────────────────────────────────────────────────
  const kriDefs = [
    { code: "EXPENSE_RATIO", nameEn: "Expense-to-Revenue Ratio", nameAr: "نسبة المصروفات إلى الإيرادات", category: "FINANCIAL", unit: "PERCENT", direction: "HIGHER_IS_RISK", y: 50, o: 65, r: 80,
      descEn: "Total expenses as a percentage of revenue. A rising ratio means costs are eating into profitability faster than sales can cover them.",
      descAr: "إجمالي المصروفات كنسبة من الإيرادات. ارتفاع النسبة يعني أن التكاليف تلتهم الربحية أسرع من نمو المبيعات.",
      actEn: "Review printing, marketing and operating expenses; renegotiate recurring costs.", actAr: "راجعي مصروفات الطباعة والتسويق والتشغيل، وأعيدي التفاوض على التكاليف المتكررة." },
    { code: "NET_MARGIN", nameEn: "Net Profit Margin Risk", nameAr: "مخاطر هامش صافي الربح", category: "FINANCIAL", unit: "PERCENT", direction: "LOWER_IS_RISK", y: 25, o: 15, r: 10,
      descEn: "Net profit as a percentage of revenue. A declining margin signals the business is keeping less of every riyal it earns.",
      descAr: "صافي الربح كنسبة من الإيرادات. تراجع الهامش يدل على أن العمل يحتفظ بجزء أقل من كل ريال يكسبه.",
      actEn: "Review operating expenses and low-margin packages; consider adjusting pricing.", actAr: "راجعي المصروفات التشغيلية والباقات منخفضة الهامش، وفكّري في تعديل الأسعار." },
    { code: "EXPENSE_VS_REVENUE_GROWTH", nameEn: "Expense Growth vs Revenue Growth", nameAr: "نمو المصروفات مقابل نمو الإيرادات", category: "FINANCIAL", unit: "PERCENT", direction: "HIGHER_IS_RISK", y: 5, o: 15, r: 25,
      descEn: "The gap between expense growth and revenue growth. A wide positive gap means costs are outpacing sales.",
      descAr: "الفجوة بين نمو المصروفات ونمو الإيرادات. الفجوة الموجبة الكبيرة تعني أن التكاليف تنمو أسرع من المبيعات.",
      actEn: "Freeze discretionary spending until revenue growth catches up.", actAr: "أوقفي الإنفاق غير الضروري مؤقتًا حتى يلحق نمو الإيرادات بالمصروفات." },
    { code: "PROFIT_DECLINE", nameEn: "Profit Decline Streak", nameAr: "تراجع الربح المتتالي", category: "FINANCIAL", unit: "NUMBER", direction: "HIGHER_IS_RISK", y: 1, o: 2, r: 3,
      descEn: "Number of consecutive months where net profit fell versus the month before.",
      descAr: "عدد الأشهر المتتالية التي تراجع فيها صافي الربح عن الشهر السابق.",
      actEn: "Investigate cost drivers for the last 3 months and pause non-essential spending.", actAr: "افحصي أسباب ارتفاع التكاليف خلال آخر 3 أشهر وأوقفي الإنفاق غير الأساسي." },
    { code: "ORDER_VOLUME_DECLINE", nameEn: "Order Volume Decline", nameAr: "تراجع حجم الطلبات", category: "OPERATIONAL", unit: "PERCENT", direction: "HIGHER_IS_RISK", y: 10, o: 20, r: 30,
      descEn: "Percentage drop in confirmed order volume versus the previous period.",
      descAr: "نسبة الانخفاض في حجم الطلبات المؤكدة مقارنة بالفترة السابقة.",
      actEn: "Review marketing activity and follow up on pending inquiries.", actAr: "راجعي النشاط التسويقي وتابعي الاستفسارات المعلّقة." },
    { code: "AOV_DECLINE", nameEn: "Average Order Value Decline", nameAr: "تراجع متوسط قيمة الطلب", category: "FINANCIAL", unit: "PERCENT", direction: "HIGHER_IS_RISK", y: 5, o: 10, r: 20,
      descEn: "Percentage drop in average order value versus the previous period.",
      descAr: "نسبة الانخفاض في متوسط قيمة الطلب مقارنة بالفترة السابقة.",
      actEn: "Promote higher-tier packages and premium add-ons at booking time.", actAr: "روّجي للباقات الأعلى فئة والإضافات المميزة أثناء الحجز." },
    { code: "CANCELLATION_RATE", nameEn: "Cancellation Rate", nameAr: "معدل الإلغاء", category: "OPERATIONAL", unit: "PERCENT", direction: "HIGHER_IS_RISK", y: 10, o: 20, r: 30,
      descEn: "Cancelled orders as a percentage of all orders in the period.",
      descAr: "نسبة الطلبات الملغاة إلى إجمالي الطلبات خلال الفترة.",
      actEn: "Call customers before the session to confirm and reduce no-shows.", actAr: "تواصلي مع العميلات قبل الجلسة للتأكيد وتقليل حالات عدم الحضور." },
    { code: "OUTSTANDING_PAYMENTS", nameEn: "Outstanding Payments", nameAr: "المدفوعات المستحقة", category: "FINANCIAL", unit: "PERCENT", direction: "HIGHER_IS_RISK", y: 10, o: 20, r: 30,
      descEn: "Unpaid revenue as a percentage of total revenue for the period.",
      descAr: "الإيرادات غير المحصّلة كنسبة من إجمالي الإيرادات خلال الفترة.",
      actEn: "Follow up on partially-paid and unpaid orders before session delivery.", actAr: "تابعي الطلبات غير المدفوعة أو المدفوعة جزئيًا قبل تسليم الجلسة." },
    { code: "FIXED_COST_BURDEN", nameEn: "Fixed Cost Burden", nameAr: "عبء التكاليف الثابتة", category: "FINANCIAL", unit: "PERCENT", direction: "HIGHER_IS_RISK", y: 30, o: 45, r: 60,
      descEn: "Fixed monthly costs as a percentage of revenue. A high burden leaves little cushion if sales slow down.",
      descAr: "التكاليف الثابتة الشهرية كنسبة من الإيرادات. العبء المرتفع يترك هامش أمان ضئيلًا عند تباطؤ المبيعات.",
      actEn: "Review studio rent, subscriptions and fixed commitments.", actAr: "راجعي إيجار الاستديو والاشتراكات والالتزامات الثابتة." },
    { code: "BREAKEVEN_RISK", nameEn: "Break-even Risk", nameAr: "مخاطر نقطة التعادل", category: "FINANCIAL", unit: "PERCENT", direction: "HIGHER_IS_RISK", y: 0, o: 10, r: 25,
      descEn: "How far actual revenue sits below the break-even point.",
      descAr: "مدى انخفاض الإيرادات الفعلية عن نقطة التعادل.",
      actEn: "Prioritise closing pending bookings this month to reach break-even.", actAr: "ركزي على إغلاق الحجوزات المعلّقة هذا الشهر للوصول إلى نقطة التعادل." },
    { code: "BOOKING_UTILIZATION", nameEn: "Booking Capacity Utilization", nameAr: "معدل استغلال طاقة الحجز", category: "OPERATIONAL", unit: "PERCENT", direction: "LOWER_IS_RISK", y: 40, o: 25, r: 15,
      descEn: "Booked sessions as a percentage of available studio capacity (working days × time slots).",
      descAr: "الجلسات المحجوزة كنسبة من الطاقة الاستيعابية المتاحة للاستديو.",
      actEn: "Open more promotional slots or run a seasonal campaign to fill capacity.", actAr: "افتحي فترات ترويجية إضافية أو أطلقي حملة موسمية لملء الطاقة الاستيعابية." },
    { code: "BOOKING_CONVERSION", nameEn: "Booking Conversion Rate", nameAr: "معدل تحويل الحجوزات", category: "OPERATIONAL", unit: "PERCENT", direction: "LOWER_IS_RISK", y: 60, o: 40, r: 25,
      descEn: "Share of booking requests that convert into confirmed sessions.",
      descAr: "نسبة طلبات الحجز التي تتحول إلى جلسات مؤكدة.",
      actEn: "Speed up response time to new requests and simplify the deposit step.", actAr: "سرّعي الرد على الطلبات الجديدة وبسّطي خطوة دفع العربون." },
    { code: "REPEAT_CUSTOMER_RATE", nameEn: "Repeat Customer Rate", nameAr: "معدل تكرار العميلات", category: "OPERATIONAL", unit: "PERCENT", direction: "LOWER_IS_RISK", y: 15, o: 8, r: 3,
      descEn: "Share of this period's customers who have booked more than once.",
      descAr: "نسبة عميلات هذه الفترة اللواتي حجزن أكثر من مرة.",
      actEn: "Introduce a loyalty offer for returning families.", actAr: "قدّمي عرض ولاء للعائلات المتكررة." },
  ] as const;

  for (let i = 0; i < kriDefs.length; i++) {
    const k = kriDefs[i];
    await db.kriDefinition.create({
      data: {
        code: k.code, nameEn: k.nameEn, nameAr: k.nameAr,
        category: k.category as "FINANCIAL" | "OPERATIONAL",
        descriptionEn: k.descEn, descriptionAr: k.descAr, unit: k.unit,
        direction: k.direction as "HIGHER_IS_RISK" | "LOWER_IS_RISK",
        thresholdYellow: k.y, thresholdOrange: k.o, thresholdRed: k.r,
        recommendedActionEn: k.actEn, recommendedActionAr: k.actAr, sortOrder: i,
      },
    });
  }
  console.log(`Seeded ${kriDefs.length} KRI definitions.`);

  // ── Customers (DEMO) ─────────────────────────────────────────────────
  const firstNames = [
    "نورة", "سارة", "لمى", "منيرة", "هند", "ريم", "غادة", "أمل", "بشاير", "دانة",
    "شهد", "جواهر", "العنود", "روان", "لجين", "مها", "فاطمة", "عبير", "وجدان", "أثير",
    "خلود", "رغد", "ندى", "أروى", "سلمى", "الجازي", "حصة", "مشاعل", "ريناد", "تالا",
    "عبدالله", "فيصل",
  ];
  const lastNames = [
    "العتيبي", "القحطاني", "الشمري", "الدوسري", "الحربي", "المطيري", "الغامدي", "الزهراني",
    "العنزي", "السبيعي", "الرشيدي", "البقمي", "الجهني", "العمري", "الشهري",
  ];
  const customers = [];
  for (let i = 0; i < 32; i++) {
    const fullName = `${rand(firstNames)} ${rand(lastNames)}`;
    const phone = `05${randInt(0, 9)}${randInt(1000000, 9999999)}`;
    const c = await db.customer.create({
      data: {
        fullName, phone,
        email: Math.random() > 0.4 ? `client${i + 1}@example.com` : null,
      },
    });
    customers.push(c);
  }
  console.log(`Seeded ${customers.length} demo customers.`);

  // ── Orders + Expenses across the last 6 months (DEMO, crafted to demonstrate
  //    healthy → warning → critical KRI trends) ────────────────────────
  const now = new Date(); // platform "today"
  const packagePool = [
    { item: packages.find((p) => p.slug === "newborn-economic-2")!, weight: 3 },
    { item: packages.find((p) => p.slug === "newborn-bronze")!, weight: 3 },
    { item: packages.find((p) => p.slug === "newborn-gold")!, weight: 2 },
    { item: packages.find((p) => p.slug === "newborn-diamond")!, weight: 1 },
    { item: packages.find((p) => p.slug === "maternity-1")!, weight: 2 },
    { item: packages.find((p) => p.slug === "maternity-2")!, weight: 2 },
    { item: packages.find((p) => p.slug === "family-session")!, weight: 2 },
    { item: packages.find((p) => p.slug === "themed-session")!, weight: 1 },
    { item: packages.find((p) => p.slug === "lifestyle-session")!, weight: 2 },
  ];

  interface MonthPlan {
    offset: number; // months back from current month (0 = current month)
    orders: number; cancelled: number;
    operatingVariable: number; recordedDirect: number;
  }
  const monthPlans: MonthPlan[] = [
    { offset: 5, orders: 8, cancelled: 0, operatingVariable: 150, recordedDirect: 150 }, // 5 months ago
    { offset: 4, orders: 9, cancelled: 1, operatingVariable: 180, recordedDirect: 170 },
    { offset: 3, orders: 10, cancelled: 0, operatingVariable: 220, recordedDirect: 190 },
    { offset: 2, orders: 11, cancelled: 1, operatingVariable: 600, recordedDirect: 210 },
    { offset: 1, orders: 8, cancelled: 2, operatingVariable: 1100, recordedDirect: 400 }, // marketing push + equipment repair
    { offset: 0, orders: 6, cancelled: 2, operatingVariable: 2800, recordedDirect: 140 }, // current (partial) month — critical
  ];

  const usedSlots = new Set<string>(); // `${yyyy-mm-dd}|${time}`
  let orderSeq = 1;
  const orderNumberFor = () => `1R-${now.getFullYear()}-${pad(orderSeq++, 4)}`;

  const paymentMethods = ["BANK_TRANSFER", "CASH", "CARD"];

  for (const plan of monthPlans) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - plan.offset, 1);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = plan.offset === 0 ? now.getDate() : new Date(year, month + 1, 0).getDate();

    const totalToCreate = plan.orders + plan.cancelled;
    for (let i = 0; i < totalToCreate; i++) {
      const isCancelled = i < plan.cancelled;
      const pkg = weightedPick(packagePool);
      const customer = rand(customers);

      // find a free (date, slot) within the month, on a working day (not Friday=5)
      let day = 0, timeLabel = "";
      let attempts = 0;
      do {
        day = randInt(1, daysInMonth);
        const d = new Date(year, month, day);
        if (d.getDay() === 5) { attempts++; continue; }
        timeLabel = rand(slotLabels);
        attempts++;
      } while (usedSlots.has(`${year}-${pad(month + 1)}-${pad(day)}|${timeLabel}`) && attempts < 50);
      const key = `${year}-${pad(month + 1)}-${pad(day)}|${timeLabel}`;
      if (!isCancelled) usedSlots.add(key);
      const eventDate = toDateOnly(year, month, day);

      // add-ons: sometimes attach 0-2 real add-ons from this package
      const availableAddons = await db.addonOption.findMany({ where: { packageId: pkg.id } });
      const chosen: typeof availableAddons = [];
      if (availableAddons.length > 0 && Math.random() > 0.45) {
        chosen.push(rand(availableAddons));
        if (availableAddons.length > 1 && Math.random() > 0.7) {
          const second = rand(availableAddons);
          if (!chosen.includes(second)) chosen.push(second);
        }
      }
      const addonsTotal = chosen.reduce((s, a) => s + Number(a.price), 0);
      const total = Number(pkg.price) + addonsTotal;

      // status distribution
      let status: OrderStatus;
      let paymentStatus: PaymentStatus;
      if (isCancelled) {
        status = OrderStatus.CANCELLED;
        paymentStatus = Math.random() > 0.5 ? PaymentStatus.REFUNDED : PaymentStatus.UNPAID;
      } else if (plan.offset === 0) {
        // current month: mix of upcoming/confirmed/completed, more unpaid/partial (recent)
        status = rand([OrderStatus.COMPLETED, OrderStatus.CONFIRMED, OrderStatus.IN_PROGRESS, OrderStatus.CONFIRMED]);
        paymentStatus = rand([PaymentStatus.PARTIALLY_PAID, PaymentStatus.UNPAID, PaymentStatus.PAID, PaymentStatus.PARTIALLY_PAID]);
      } else {
        status = OrderStatus.COMPLETED;
        paymentStatus = rand([PaymentStatus.PAID, PaymentStatus.PAID, PaymentStatus.PAID, PaymentStatus.PARTIALLY_PAID]);
      }

      const order = await db.order.create({
        data: {
          orderNumber: orderNumberFor(),
          customerId: customer.id, serviceId: pkg.serviceId, packageId: pkg.id,
          eventDate, eventTime: timeLabel,
          location: rand(["منزل العميلة", "مستشفى الولادة", "استوديو 1R.", "Home visit", "Hospital"]),
          notes: null,
          packagePriceSnapshot: pkg.price, addonsTotalSnapshot: addonsTotal, total,
          directCostSnapshot: pkg.directCost,
          depositAmount: pkg.depositAmount,
          status, paymentStatus, source: Math.random() > 0.25 ? "WEBSITE" : "MANUAL",
          createdAt: new Date(eventDate.getTime() - randInt(3, 20) * 86400000),
          completedAt: status === "COMPLETED" ? eventDate : null,
          cancelledAt: isCancelled ? new Date(eventDate.getTime() - randInt(1, 5) * 86400000) : null,
          addons: {
            create: chosen.map((a) => ({
              addonOptionId: a.id, nameEnSnapshot: a.nameEn, nameArSnapshot: a.nameAr, priceSnapshot: a.price, qty: 1,
            })),
          },
        },
      });

      if (!isCancelled) {
        await db.bookingSlotLock.create({ data: { eventDate, eventTime: timeLabel, orderId: order.id } });
      }

      // payments
      if (paymentStatus === "PAID") {
        await db.payment.create({ data: { orderId: order.id, amount: pkg.depositAmount, method: rand(paymentMethods), type: "DEPOSIT", paidAt: order.createdAt } });
        await db.payment.create({ data: { orderId: order.id, amount: total - Number(pkg.depositAmount), method: rand(paymentMethods), type: "BALANCE", paidAt: eventDate } });
      } else if (paymentStatus === "PARTIALLY_PAID") {
        await db.payment.create({ data: { orderId: order.id, amount: pkg.depositAmount, method: rand(paymentMethods), type: "DEPOSIT", paidAt: order.createdAt } });
      } else if (paymentStatus === "REFUNDED") {
        await db.payment.create({ data: { orderId: order.id, amount: pkg.depositAmount, method: rand(paymentMethods), type: "DEPOSIT", paidAt: order.createdAt } });
        await db.payment.create({ data: { orderId: order.id, amount: -Number(pkg.depositAmount), method: rand(paymentMethods), type: "REFUND", paidAt: order.cancelledAt ?? eventDate, note: "Cancellation refund" } });
      }
    }

    // ── Expenses for this month ─────────────────────────────────────
    const expenseDay = (d: number) => toDateOnly(year, month, Math.min(d, daysInMonth));

    // recurring operating baseline (~900 SAR/mo, matches Settings.fixedCostsMonthly)
    await db.expense.create({ data: { name: "Studio rent", categoryId: catIds.rent, amount: 500, date: expenseDay(1), expenseType: "OPERATING", isRecurring: true, paymentMethod: "BANK_TRANSFER" } });
    await db.expense.create({ data: { name: "Internet subscription", categoryId: catIds.internet, amount: 80, date: expenseDay(2), expenseType: "OPERATING", isRecurring: true, paymentMethod: "CARD" } });
    await db.expense.create({ data: { name: "Phone plan", categoryId: catIds.phone, amount: 60, date: expenseDay(2), expenseType: "OPERATING", isRecurring: true, paymentMethod: "CARD" } });
    await db.expense.create({ data: { name: "Editing software subscriptions", categoryId: catIds.software, amount: 100, date: expenseDay(3), expenseType: "OPERATING", isRecurring: true, paymentMethod: "CARD" } });
    await db.expense.create({ data: { name: "Adobe Creative Cloud", categoryId: catIds.adobe, amount: 80, date: expenseDay(3), expenseType: "OPERATING", isRecurring: true, paymentMethod: "CARD" } });
    await db.expense.create({ data: { name: "Website hosting", categoryId: catIds.hosting, amount: 30, date: expenseDay(4), expenseType: "OPERATING", isRecurring: true, paymentMethod: "CARD" } });
    await db.expense.create({ data: { name: "Electricity", categoryId: catIds.electricity, amount: randInt(120, 220), date: expenseDay(5), expenseType: "OPERATING", isRecurring: true, paymentMethod: "CASH" } });

    // variable operating (split into 2-3 line items across marketing/advertising/maintenance/salaries/insurance/other)
    let remainingVariable = plan.operatingVariable;
    const variableCats = ["marketing", "advertising", "maintenance", "salaries", "insurance", "other"];
    const nLines = plan.operatingVariable > 1000 ? 4 : 2;
    for (let i = 0; i < nLines; i++) {
      const isLast = i === nLines - 1;
      const amount = isLast ? remainingVariable : Math.round(remainingVariable * (0.3 + Math.random() * 0.3));
      remainingVariable -= amount;
      if (amount <= 0) continue;
      const catKey = rand(variableCats);
      await db.expense.create({
        data: {
          name: `${directCats.find((c) => c.key === catKey)?.nameEn ?? operatingCats.find((c) => c.key === catKey)!.nameEn} — ${monthDate.toLocaleString("en", { month: "short" })}`,
          categoryId: catIds[catKey], amount, date: expenseDay(randInt(6, Math.min(28, daysInMonth))),
          expenseType: "OPERATING", isRecurring: false, paymentMethod: rand(paymentMethods),
        },
      });
    }

    // recorded direct expenses (printing runs, freelancer invoices, props, transport, event-specific)
    let remainingDirect = plan.recordedDirect;
    const directKeys = ["album_printing", "photo_printing", "frames", "packaging", "freelancers", "transport", "props", "event_specific"];
    const nDirectLines = 3;
    for (let i = 0; i < nDirectLines; i++) {
      const isLast = i === nDirectLines - 1;
      const amount = isLast ? remainingDirect : Math.round(remainingDirect * (0.25 + Math.random() * 0.35));
      remainingDirect -= amount;
      if (amount <= 0) continue;
      const catKey = rand(directKeys);
      await db.expense.create({
        data: {
          name: `${directCats.find((c) => c.key === catKey)!.nameEn} — ${monthDate.toLocaleString("en", { month: "short" })}`,
          categoryId: catIds[catKey], amount, date: expenseDay(randInt(6, Math.min(28, daysInMonth))),
          expenseType: "DIRECT", isRecurring: false, paymentMethod: rand(paymentMethods),
        },
      });
    }
  }
  console.log(`Seeded orders & expenses across ${monthPlans.length} months.`);

  // ── Upcoming bookings (future, for calendar/availability demo) ───────
  const upcomingStatuses: OrderStatus[] = ["NEW", "PENDING", "CONFIRMED", "CONFIRMED"];
  for (let i = 0; i < 6; i++) {
    const pkg = weightedPick(packagePool);
    const customer = rand(customers);
    let day: number, timeLabel: string, eventDate: Date, key: string;
    let attempts = 0;
    do {
      day = randInt(now.getDate() + 1, now.getDate() + 30);
      const d = new Date(now.getFullYear(), now.getMonth(), day);
      eventDate = toDateOnly(d.getFullYear(), d.getMonth(), d.getDate());
      timeLabel = rand(slotLabels);
      key = `${eventDate.toISOString().slice(0, 10)}|${timeLabel}`;
      attempts++;
    } while ((eventDate.getUTCDay() === 5 || usedSlots.has(key)) && attempts < 50);
    usedSlots.add(key);

    const status = rand(upcomingStatuses);
    const order = await db.order.create({
      data: {
        orderNumber: orderNumberFor(), customerId: customer.id, serviceId: pkg.serviceId, packageId: pkg.id,
        eventDate, eventTime: timeLabel, location: "Home visit",
        packagePriceSnapshot: pkg.price, addonsTotalSnapshot: 0, total: pkg.price,
        directCostSnapshot: pkg.directCost, depositAmount: pkg.depositAmount,
        status, paymentStatus: status === "NEW" ? "UNPAID" : "PARTIALLY_PAID", source: "WEBSITE",
      },
    });
    await db.bookingSlotLock.create({ data: { eventDate, eventTime: timeLabel, orderId: order.id } });
    if (status !== "NEW") {
      await db.payment.create({ data: { orderId: order.id, amount: pkg.depositAmount, method: "BANK_TRANSFER", type: "DEPOSIT", paidAt: new Date() } });
    }
  }

  // ── Blocked dates (vacation example) ──────────────────────────────────
  for (let i = 5; i <= 9; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + 1, i);
    await db.blockedDate.create({
      data: { date: toDateOnly(d.getFullYear(), d.getMonth(), d.getDate()), isFullDay: true, type: BlockedDateType.VACATION, reason: "Studio vacation" },
    });
  }

  console.log("Seed complete.");
  console.log("Owner login → email: owner@1rstudio.sa / password: Studio@2026");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
