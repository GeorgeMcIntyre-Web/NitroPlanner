"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    const templates = await prisma.processTemplate.findMany();
    res.json(templates);
});
router.post('/', async (req, res) => {
    const { name, description, roleType, workUnitType, templateData, companyId } = req.body;
    const template = await prisma.processTemplate.create({
        data: { name, description, roleType, workUnitType, templateData, companyId }
    });
    res.status(201).json(template);
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: 'Template ID is required' });
            return;
        }
        const template = await prisma.processTemplate.findUnique({
            where: { id }
        });
        if (!template) {
            res.status(404).json({ error: 'Template not found' });
            return;
        }
        res.json(template);
        return;
    }
    catch (error) {
        console.error('Error fetching template:', error);
        res.status(500).json({ error: 'Failed to fetch template' });
        return;
    }
});
router.post('/apply-template', async (req, res) => {
    res.status(501).json({ message: 'Not implemented yet' });
});
exports.default = router;
//# sourceMappingURL=templates.js.map