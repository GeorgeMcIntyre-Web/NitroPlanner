"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    const templates = await prisma.processTemplate.findMany({
        include: { steps: true }
    });
    res.json(templates);
});
router.post('/', async (req, res) => {
    const { name, description, createdBy } = req.body;
    const template = await prisma.processTemplate.create({
        data: { name, description, createdBy }
    });
    res.status(201).json(template);
});
router.get('/:id', async (req, res) => {
    const id = Number(req.params.id);
    const template = await prisma.processTemplate.findUnique({
        where: { id },
        include: { steps: true }
    });
    if (!template)
        return res.status(404).json({ error: 'Template not found' });
    res.json(template);
});
router.post('/:id/steps', async (req, res) => {
    const templateId = Number(req.params.id);
    const { stepName, sequenceOrder, baselineTimeHours, assignmentType, assignedRoleId, assignedMachineId, dependencyStepId } = req.body;
    const step = await prisma.templateStep.create({
        data: {
            templateId,
            stepName,
            sequenceOrder,
            baselineTimeHours,
            assignmentType,
            assignedRoleId,
            assignedMachineId,
            dependencyStepId
        }
    });
    res.status(201).json(step);
});
router.put('/steps/:step_id', async (req, res) => {
    const id = Number(req.params.step_id);
    const data = req.body;
    const step = await prisma.templateStep.update({
        where: { id },
        data
    });
    res.json(step);
});
router.delete('/steps/:step_id', async (req, res) => {
    const id = Number(req.params.step_id);
    await prisma.templateStep.delete({ where: { id } });
    res.status(204).end();
});
router.post('/apply-template', async (req, res) => {
    res.status(501).json({ message: 'Not implemented yet' });
});
exports.default = router;
//# sourceMappingURL=templates.js.map