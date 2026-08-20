// Maps Prisma catalog results (which contain Decimal instances) into plain,
// JSON-serializable DTOs safe to pass from Server Components into Client Components.
import type { Service, Package, PackageInclusion, AddonOption } from "@prisma/client";
import type { ServiceWithPackages, PackageDTO } from "@/components/booking/booking-wizard";

type ServiceWithFullPackages = Service & {
  packages: (Package & { inclusions: PackageInclusion[]; addons: AddonOption[] })[];
};

export function toPackageDTO(pkg: Package & { inclusions: PackageInclusion[]; addons: AddonOption[] }): PackageDTO {
  return {
    id: pkg.id, serviceId: pkg.serviceId, slug: pkg.slug, nameEn: pkg.nameEn, nameAr: pkg.nameAr,
    descriptionEn: pkg.descriptionEn, descriptionAr: pkg.descriptionAr,
    price: pkg.price.toString(), depositAmount: pkg.depositAmount.toString(), durationMinutes: pkg.durationMinutes,
    inclusions: pkg.inclusions.map((i) => ({ id: i.id, textEn: i.textEn, textAr: i.textAr })),
    addons: pkg.addons.map((a) => ({ id: a.id, nameEn: a.nameEn, nameAr: a.nameAr, price: a.price.toString() })),
  };
}

export function toServiceDTO(service: ServiceWithFullPackages): ServiceWithPackages {
  return {
    id: service.id, slug: service.slug, nameEn: service.nameEn, nameAr: service.nameAr,
    descriptionEn: service.descriptionEn, descriptionAr: service.descriptionAr,
    packages: service.packages.map(toPackageDTO),
  };
}
