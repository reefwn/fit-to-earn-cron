import { DocumentNumberEntity } from 'src/entities/document-number.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

@Injectable()
export class DocumentNumberService {
  constructor(
    @InjectRepository(DocumentNumberEntity)
    private readonly documentNumberRepo: Repository<DocumentNumberEntity>,
  ) {}

  async getRunNo() {
    const d = new Date();
    const currentYear = d.getFullYear();
    const currentMonth = d.getMonth();

    const currentNumber = await this.documentNumberRepo.findOne({
      where: {
        current_year: `${currentYear}`,
        current_month: `${currentMonth}`,
      },
      order: { id: 'DESC' },
    });

    let runno = 0;
    let saveEntity: DocumentNumberEntity;
    if (!currentNumber) {
      saveEntity = new DocumentNumberEntity();
      saveEntity.current_year = `${currentYear}`;
      saveEntity.current_month = `${currentMonth}`;
    } else {
      saveEntity = currentNumber;
      runno = currentNumber.running_number + 1;
    }
    saveEntity.running_number = runno;
    await this.documentNumberRepo.save(saveEntity);

    const formatMonth = `${currentMonth}`.padStart(2, '0');
    const formatRunno = `${runno}`.padStart(6, '0');
    const formatNumber = `${currentYear}${formatMonth}${formatRunno}`;

    return formatNumber;
  }
}
