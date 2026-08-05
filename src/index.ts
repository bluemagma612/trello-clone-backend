import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const port = Number(process.env.PORT) || 8080;

type Card = {
	id: string;
	title: string;
	description?: string;
};

type List = {
	id: string;
	title: string;
	cards: Card[];
};

type BoardState = {
	lists: List[];
};

let boardState: BoardState = { lists: [] };

const isObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null;

const isString = (value: unknown): value is string =>
	typeof value === 'string' && value.trim().length > 0;

const validateCard = (value: unknown): value is Card => {
	if (!isObject(value)) return false;
	if (!isString(value.id)) return false;
	if (!isString(value.title)) return false;
	if (
		value.description !== undefined &&
		typeof value.description !== 'string'
	)
		return false;
	return true;
};

const validateList = (value: unknown): value is List => {
	if (!isObject(value)) return false;
	if (!isString(value.id)) return false;
	if (!isString(value.title)) return false;
	if (!Array.isArray(value.cards)) return false;
	if (!value.cards.every(validateCard)) return false;
	return true;
};

const validateBoardState = (value: unknown): value is BoardState => {
	if (!isObject(value)) return false;
	if (!Array.isArray(value.lists)) return false;
	if (!value.lists.every(validateList)) return false;
	return true;
};

const parseSavePayload = (value: unknown): BoardState | null => {
	if (validateBoardState(value)) {
		return value;
	}

	if (!isObject(value) || !('lists' in value)) {
		return null;
	}

	const candidate = { lists: (value as { lists: unknown }).lists };
	return validateBoardState(candidate) ? candidate : null;
};

app.get('/health', (_req: Request, res: Response) => {
	return res.status(200).json({ status: 'ok' });
});

app.post('/save', (req: Request, res: Response) => {
	const parsed = parseSavePayload(req.body);
	if (!parsed) {
		return res.status(400).json({
			success: false,
			error:
				'Invalid payload: expected { lists: [{ id, title, cards: [{ id, title, description? }] }] }'
		});
	}

	boardState = parsed;
	return res.status(200).json({ success: true });
});

app.get('/load', (_req: Request, res: Response) => {
	return res.status(200).json(boardState);
});

app.use((_req: Request, res: Response) => {
	return res.status(404).json({
		success: false,
		error: 'Route not found'
	});
});

app.listen(port, () => {
	console.log(`Kanban backend running on http://localhost:${port}!`);
});
