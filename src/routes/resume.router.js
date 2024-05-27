import express from 'express';
import dotEnv from 'dotenv';
import { prisma } from '../utils/prisma.util.js';
import authMiddleware from '../middlewares/auth.middleware.js';
//import { Prisma } from '@prisma/client';

dotEnv.config();
const router = express.Router();

router.post('/resume', authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;

    const { title, content } = req.body;

    if (!title) {
      return res
        .status(400)
        .json({ status: 400, message: '제목을 입력해주세요.' });
    } else if (!content) {
      return res
        .status(400)
        .json({ status: 400, message: '내용을 입력해주세요.' });
    } else if (content.length < 150) {
      return res.status(400).json({
        status: 400,
        message: '이력서 내용은 150자 이상 작성해야 합니다.',
      });
    }

    const myResume = await prisma.myResumes.create({
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

router.get('/resume', authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;

    const { sort } = req.query;

    const myPage = await prisma.Users.findMany({
      where: {
        userId,
      },
      select: {
        userId: true,

        userInfos: {
          select: {
            name: true,
          },
        },
        myResumes: {
          select: {
            resumeId: true,
            title: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: 'desc' ?? sort.toLowerCase(),
          },
        },
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

router.get('/resume/:id', authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const resumeId = req.params.id;

    const myResume = await prisma.Users.findFirst({
      where: {
        userId,
      },
      select: {
        userInfos: {
          select: {
            name: true,
          },
        },
        myResumes: {
          where: {
            resumeId: +resumeId,
          },
          select: {
            title: true,
            content: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!String(myResume.myResumes)) {
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

router.patch('/resume/:id', authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const resumeId = req.params.id;
    const { title, content } = req.body;

    //console.log(typeof editResume.title);

    // if (!editResume) {
    //   return res
    //     .status(400)
    //     .json({ status: 400, message: '수정할 내용을 입력해주세요.' });
    // } else if (editResume.content && editResume.content.length < 150) {
    //   return res.status(400).json({
    //     status: 400,
    //     message: '이력서 내용은 150자 이상 작성해야 합니다.',
    //   });
    // }

    if (!title && !content) {
      return res
        .status(400)
        .json({ status: 400, message: '수정할 내용을 입력해주세요.' });
    } else if (title == '') {
      return res.status(400).json({
        status: 400,
        message: '이력서 제목은 1자 이상 작성해야 합니다.',
      });
    } else if (content.length < 150) {
      return res.status(400).json({
        status: 400,
        message: '이력서 내용은 150자 이상 작성해야 합니다.',
      });
    }

    const editResume = { title, content };

    const findResume = await prisma.MyResumes.findFirst({
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

    const myResume = await prisma.MyResumes.update({
      data: {
        ...editResume,
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

router.delete('/resume/:id', authMiddleware, async (req, res, next) => {
  const { userId } = req.user;
  const resumeId = req.params.id;

  const findResume = await prisma.MyResumes.findFirst({
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

  await prisma.MyResumes.delete({
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
});

export default router;
