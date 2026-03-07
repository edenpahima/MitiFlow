import { Controller, Post, Get, Body } from '@nestjs/common';
import { SimulatorService } from '../simulator/simulator.service';

@Controller('api/simulate')
export class SimulateController {
  constructor(private readonly simulatorService: SimulatorService) {}

  @Post('syn-flood')
  startSynFlood(
    @Body() body: { victimIp: string; intensity: 'low' | 'medium' | 'high' },
  ) {
    this.simulatorService.startSynFlood(body.victimIp, body.intensity);
    return { message: 'SYN flood simulation started', ...body };
  }

  @Post('udp-amplification')
  startUdpAmplification(
    @Body()
    body: {
      victimIp: string;
      intensity: 'low' | 'medium' | 'high';
      amplificationFactor?: number;
    },
  ) {
    this.simulatorService.startUdpAmplification(
      body.victimIp,
      body.intensity,
      body.amplificationFactor ?? 50,
    );
    return { message: 'UDP amplification simulation started', ...body };
  }

  @Post('icmp-flood')
  startIcmpFlood(
    @Body() body: { victimIp: string; intensity: 'low' | 'medium' | 'high' },
  ) {
    this.simulatorService.startIcmpFlood(body.victimIp, body.intensity);
    return { message: 'ICMP flood simulation started', ...body };
  }

  @Post('stop')
  stopAttack() {
    this.simulatorService.stopAttack();
    return { message: 'Attack simulation stopped' };
  }

  @Get('status')
  getStatus() {
    return this.simulatorService.getStatus();
  }
}
