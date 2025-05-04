import { BadRequestException, Type } from '@nestjs/common';

export async function tryCatchWrapper<T>(
  arg: any,
  message: string = '',
  exception: Type<BadRequestException> = BadRequestException,
): Promise<T> {
  let result: T;
  try {
    result = await arg;
  } catch (err) {
    console.log(err);
    throw new exception(err?.message ?? message);
  }
  return result;
}
