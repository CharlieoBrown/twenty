import { Injectable } from '@nestjs/common';

import { KeyValuePairType } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { KeyValuePairService } from 'src/engine/core-modules/key-value-pair/key-value-pair.service';
import { mergeUserVars } from 'src/engine/core-modules/user/user-vars/utils/merge-user-vars.util';

@Injectable()
export class UserVarsService<
  KeyValueTypesMap extends Record<string, any> = Record<string, any>,
> {
  constructor(private readonly keyValuePairService: KeyValuePairService) {}

  public async get<K extends keyof KeyValueTypesMap>({
    userId,
    workspaceId,
    key,
  }: {
    userId?: string;
    workspaceId?: string;
    key: Extract<K, string>;
  }): Promise<KeyValueTypesMap[K]> {
    const userVarWorkspaceLevel = await this.keyValuePairService.get({
      type: KeyValuePairType.USER_VAR,
      userId: null,
      workspaceId,
      key,
    });

    if (userVarWorkspaceLevel.length > 1) {
      throw new Error(
        `Multiple values found for key ${key} at workspace level`,
      );
    }

    const userVarUserLevel = await this.keyValuePairService.get({
      type: KeyValuePairType.USER_VAR,
      userId,
      key,
    });

    if (userVarUserLevel.length > 1) {
      throw new Error(`Multiple values found for key ${key} at user level`);
    }

    return mergeUserVars([...userVarUserLevel, ...userVarWorkspaceLevel]).get(
      key,
    ) as KeyValueTypesMap[K];
  }

  public async getAll({
    userId,
    workspaceId,
  }: {
    userId?: string;
    workspaceId?: string;
  }): Promise<Map<Extract<keyof KeyValueTypesMap, string>, any>> {
    const userVarsWorkspaceLevel = await this.keyValuePairService.get({
      type: KeyValuePairType.USER_VAR,
      userId: null,
      workspaceId,
    });

    const userVarsUserLevel = await this.keyValuePairService.get({
      type: KeyValuePairType.USER_VAR,
      userId,
    });

    return mergeUserVars<Extract<keyof KeyValueTypesMap, string>>([
      ...userVarsWorkspaceLevel,
      ...userVarsUserLevel,
    ]);
  }

  set<K extends keyof KeyValueTypesMap>({
    userId,
    workspaceId,
    key,
    value,
  }: {
    userId?: string;
    workspaceId?: string;
    key: Extract<K, string>;
    value: KeyValueTypesMap[K];
  }) {
    return this.keyValuePairService.set({
      userId,
      workspaceId,
      key: key,
      value,
      type: KeyValuePairType.USER_VAR,
    });
  }

  async delete({
    userId,
    workspaceId,
    key,
  }: {
    userId?: string;
    workspaceId?: string;
    key: Extract<keyof KeyValueTypesMap, string>;
  }) {
    return this.keyValuePairService.delete({
      userId,
      workspaceId,
      key,
      type: KeyValuePairType.USER_VAR,
    });
  }
}