import { prisma } from "./prisma";

export function getServices() {
  return prisma.service.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      packages: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: { inclusions: { orderBy: { sortOrder: "asc" } }, addons: { where: { isActive: true } } },
      },
    },
  });
}

export function getServiceBySlug(slug: string) {
  return prisma.service.findUnique({
    where: { slug },
    include: {
      packages: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: { inclusions: { orderBy: { sortOrder: "asc" } }, addons: { where: { isActive: true } } },
      },
    },
  });
}

export function getPackages() {
  return prisma.package.findMany({
    where: { isActive: true },
    orderBy: [{ service: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    include: { service: true, inclusions: { orderBy: { sortOrder: "asc" } }, addons: { where: { isActive: true } } },
  });
}

export function getPackageBySlug(slug: string) {
  return prisma.package.findUnique({
    where: { slug },
    include: { service: true, inclusions: { orderBy: { sortOrder: "asc" } }, addons: { where: { isActive: true } } },
  });
}

export function getPackageById(id: string) {
  return prisma.package.findUnique({
    where: { id },
    include: { service: true, inclusions: { orderBy: { sortOrder: "asc" } }, addons: { where: { isActive: true } } },
  });
}
