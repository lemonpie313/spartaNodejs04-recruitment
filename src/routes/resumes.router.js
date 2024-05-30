import express from 'express';
import { prisma } from '../utils/prisma.util.js';
import accessTokenMiddleware from '../middlewares/access-token.middleware.js';
import requireRoles from '../middlewares/role.middleware.js';
import { createResumeValidator, editResumeValidator } from '../middlewares/joi/resume.joi.middleware.js';

const router = express.Router();

router.post('/resume', accessTokenMiddleware, requireRoles(['APPLICANT']), createResumeValidator, async (req, res, next) => {
  try {
    const { userId } = req.user;

    const { title, content } = req.body;

    if (!title) {
      return res.status(400).json({ status: 400, message: '제목을 입력해주세요.' });
    } else if (!content) {
      return res.status(400).json({ status: 400, message: '내용을 입력해주세요.' });
    } else if (content.length < 150) {
      return res.status(400).json({
        status: 400,
        message: '이력서 내용은 150자 이상 작성해야 합니다.',
      });
    }

    const myResume = await prisma.Resume.create({
      data: {
        userId,
        title,
        content,
      },
      select: {
        resumeId: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(201).json({
      status: 201,
      message: '이력서 등록이 완료되었습니다.',
      data: { myResume },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/resume', accessTokenMiddleware, async (req, res, next) => {
  try {
    const { userId, role } = req.user;

    const { sort, status } = req.query;

    const myPage = await prisma.Resume.findMany({
      where: {
        userId:
          role == 'APPLICANT'
            ? userId
            : {
                gt: 0,
              },
        status,
      },
      select: {
        users: {
          select: {
            userInfos: {
              select: {
                name: true,
              },
            },
          },
        },
        resumeId: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: sort ?? 'desc',
      },
    });

    return res.status(200).json({
      status: 200,
      message: '이력서 조회에 성공했습니다.',
      data: { myPage },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/resume/:id', accessTokenMiddleware, async (req, res, next) => {
  try {
    const { userId, role } = req.user;
    const resumeId = req.params.id;

    const myResume = await prisma.Resume.findFirst({
      where: {
        resumeId: +resumeId,
        userId:
          role == 'APPLICANT'
            ? userId
            : {
                gt: 0,
              },
      },
      select: {
        users: {
          select: {
            userInfos: {
              select: {
                name: true,
              },
            },
          },
        },
        title: true,
        content: true,
      },
    });

    if (!myResume) {
      return res.status(404).json({
        status: 404,
        message: '이력서가 존재하지 않습니다.',
      });
    }

    return res.status(200).json({
      status: 200,
      message: '이력서 상세조회에 성공했습니다.',
      data: { myResume },
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/resume/:id', accessTokenMiddleware, requireRoles(['APPLICANT']), editResumeValidator, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const resumeId = req.params.id;
    const { title, content } = req.body;
    console.log('타이틀');
    const findResume = await prisma.Resume.findFirst({
      where: {
        userId,
        resumeId: +resumeId,
      },
    });

    if (!findResume) {
      return res.status(404).json({
        status: 404,
        message: '이력서가 존재하지 않습니다.',
      });
    }

    const myResume = await prisma.Resume.update({
      data: {
        title,
        content,
      },
      where: {
        userId,
        resumeId: +resumeId,
      },
      select: {
        resumeId: true,
        userId: true,
        title: true,
        content: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      status: 200,
      message: '이력서 수정이 완료되었습니다.',
      data: { myResume },
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/resume/:id', accessTokenMiddleware, requireRoles(['APPLICANT']), async (req, res, next) => {
  try {
    const { userId } = req.user;
    const resumeId = req.params.id;

    const findResume = await prisma.Resume.findFirst({
      where: {
        userId,
        resumeId: +resumeId,
      },
    });

    if (!findResume) {
      return res.status(404).json({
        status: 404,
        message: '이력서가 존재하지 않습니다.',
      });
    }

    await prisma.Resume.delete({
      where: {
        userId,
        resumeId: +resumeId,
      },
    });
    return res.status(200).json({
      status: 200,
      message: '이력서 삭제가 완료되었습니다.',
      data: { userId: userId },
    });
  } catch (err) {
    next(err);
  }
});

export default router;