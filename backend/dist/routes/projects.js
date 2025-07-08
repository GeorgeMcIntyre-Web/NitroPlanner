"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.get('/', async (req, res) => {
    try {
        const projects = await prisma.project.findMany({
            select: {
                id: true,
                name: true,
                description: true,
                status: true,
                priority: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        res.json(projects);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});
exports.default = router;
//# sourceMappingURL=projects.js.map