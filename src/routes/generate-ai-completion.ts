import { FastifyInstance } from "fastify";
import { z } from 'zod'
import { prisma } from "../lib/prisma";
import { openai } from "../lib/openai";
import {streamToResponse, OpenAIStream } from "ai"


export async function genarteCompletionRoute(app: FastifyInstance) {
    app.post('/ai/complete', async (req, reply) => {

        const paramsSchema = z.object({
            videoId: z.string().uuid(),
            prompt: z.string(),
            temperature: z.number().min(0).max(1).default(0.5)
        })

        const { temperature, prompt, videoId } = paramsSchema.parse(req.body)

        const video = await prisma.video.findFirstOrThrow({
            where: {
                id: videoId,
            }
        })

        if (!video.transcription) {
            return reply.status(400).send({ error: 'Video transcription was not generate yet' })
        }

        const prompMessage = prompt.replace('{transcription}', video.transcription)

        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo-16k',
            temperature,
            messages: [
                { role: 'user', content: prompMessage }
            ],
            // stream: true
        })

        return response


        // const stream = OpenAIStream(response)
        // streamToResponse(stream, reply.raw, {
        //     headers: {
        //         'Access-Control-Allow-Origin': '*',
        //         'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        //     }
        // })
    })
}