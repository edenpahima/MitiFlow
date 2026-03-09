import { Controller, Get, Param, Patch, Query, Body } from '@nestjs/common';
import { DetectionService } from '../detection/detection.service';

@Controller('api/attacks')
export class AttacksController {
  constructor(private readonly detectionService: DetectionService) {}

  @Get()
  getAttacks(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('victimIp') victimIp?: string,
  ) {
    return this.detectionService.getAttacks(
      status,
      limit ? parseInt(limit) : 50,
      victimIp,
    );
  }

  @Get('stats')
  getStats() {
    return this.detectionService.getStats();
  }

  @Get(':id')
  getAttackById(@Param('id') id: string) {
    return this.detectionService.getAttackById(id);
  }

  @Patch(':id')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    const attack = await this.detectionService.getAttackById(id);
    if (!attack) return { message: 'Attack not found' };
    attack.status = body.status;
    return attack;
  }
}
