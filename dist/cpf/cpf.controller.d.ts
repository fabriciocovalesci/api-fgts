import { CpfService } from './cpf.service';
import { RequestDto } from './dto/request.dto';
export declare class CpfController {
    private readonly cpfService;
    constructor(cpfService: CpfService);
    listProdudts(requestDto: RequestDto): Promise<any>;
    consultarCpf(requestDto: RequestDto): Promise<any[]>;
    consultarCpfBacth(requestDto: RequestDto): Promise<void>;
    downloadCsv(fileName: string, res: any): Promise<void>;
}
