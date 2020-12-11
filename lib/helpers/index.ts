import * as crypto from 'crypto';

export function md5(md5Info: any) {
  return crypto
    .createHash('md5')
    .update(`${md5Info}`)
    .digest('hex');
}

export function name2Pascal(name: string) {
  return name[0].toUpperCase() + name.slice(1);
}
